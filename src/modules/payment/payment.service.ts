import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import config from "../../config";
import { polarClient } from "../../lib/polar";
import { prisma } from "../../lib/prisma";
import { ICreateCheckoutPayload } from "./payment.interface";
import { PaymentStatus } from "@prisma/client";

const createCheckoutSessionInDB = async (
  userId: string,
  payload: ICreateCheckoutPayload
) => {
  const successUrl =
    payload.successUrl ||
    `${config.app_url}/payment/success?checkout_id={CHECKOUT_ID}`;

  // 1. Request Polar API to create a checkout session
  const checkout = await polarClient.checkouts.create({
    products: [payload.productId],
    successUrl: successUrl,
    metadata: {
      userId,
      ...payload.metadata,
    },
  });

  // 2. Record initial PENDING payment state in DB
  const payment = await prisma.payment.create({
    data: {
      userId,
      checkoutId: checkout.id,
      productId: payload.productId,
      amount: checkout.totalAmount !== undefined && checkout.totalAmount !== null ? Number(checkout.totalAmount) : 0,
      currency: checkout.currency || "usd",
      status: PaymentStatus.PENDING,
      metadata: payload.metadata || {},
    },
  });

  return {
    checkoutUrl: checkout.url,
    checkoutId: checkout.id,
    payment,
  };
};

const handlePolarWebhookInDB = async (
  headers: Record<string, string | string[] | undefined>,
  rawBody: Buffer | string
) => {
  const webhookSecret = config.polar.webhookSecret;
  if (!webhookSecret) {
    throw new Error("Polar Webhook Secret is not configured.");
  }

  // Normalize headers to object with string values
  const normalizedHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") {
      normalizedHeaders[key.toLowerCase()] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      normalizedHeaders[key.toLowerCase()] = value[0];
    }
  }

  // 1. Cryptographic HMAC verification using raw request body
  let event;
  try {
    event = validateEvent(rawBody, normalizedHeaders, webhookSecret);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      throw new Error("Invalid Polar webhook signature.");
    }
    throw err;
  }

  // 2. Handle specific event types idempotently
  const eventType = event.type;
  const data = event.data as any;

  if (eventType === "order.created" || eventType === "order.paid") {
    const checkoutId = data.checkoutId || data.checkout_id;
    const orderId = data.id;
    const metadata = data.metadata || {};
    const userId = metadata.userId;
    const totalAmount = data.totalAmount ?? data.total_amount ?? data.amount;

    if (checkoutId) {
      // Find existing payment by checkoutId
      const existingPayment = await prisma.payment.findUnique({
        where: { checkoutId },
      });

      if (existingPayment) {
        // Idempotent update: check if already completed
        if (existingPayment.status !== PaymentStatus.COMPLETED) {
          await prisma.payment.update({
            where: { checkoutId },
            data: {
              polarOrderId: orderId,
              status: PaymentStatus.COMPLETED,
              amount: totalAmount !== undefined && totalAmount !== null ? Number(totalAmount) : existingPayment.amount,
            },
          });
        }
      } else if (userId) {
        // If payment intent wasn't saved prior, create completed payment record
        await prisma.payment.create({
          data: {
            userId,
            checkoutId: checkoutId || `order_${orderId}`,
            polarOrderId: orderId,
            productId: data.productId || data.product_id,
            amount: totalAmount !== undefined && totalAmount !== null ? Number(totalAmount) : 0,
            currency: data.currency || "usd",
            status: PaymentStatus.COMPLETED,
            metadata,
          },
        });
      }
    }
  } else if (eventType === "checkout.updated") {
    const checkoutId = data.id;
    const status = data.status;

    if (checkoutId && status === "succeeded") {
      await prisma.payment.updateMany({
        where: {
          checkoutId,
          status: { not: PaymentStatus.COMPLETED },
        },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      });
    } else if (checkoutId && (status === "failed" || status === "expired")) {
      await prisma.payment.updateMany({
        where: { checkoutId },
        data: {
          status: PaymentStatus.FAILED,
        },
      });
    }
  }

  return { received: true, eventType };
};

const getPaymentStatusFromDB = async (userId: string, checkoutId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      checkoutId,
      userId,
    },
  });

  if (!payment) {
    throw new Error("Payment record not found.");
  }

  return payment;
};

export const paymentService = {
  createCheckoutSessionInDB,
  handlePolarWebhookInDB,
  getPaymentStatusFromDB,
};
