import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import config from "../../config";
import { polarClient } from "../../lib/polar";
import { prisma } from "../../lib/prisma";
import { ICreateCheckoutPayload } from "./payment.interface";
import { PaymentStatus, UserType } from "@prisma/client";

// Helper function executed when payment is verified COMPLETED
const processSuccessfulPayment = async (paymentId: string, userId: string, metadata: any) => {
  // 1. Upgrade user to PREMIUM status
  await prisma.user.update({
    where: { id: userId },
    data: { userType: UserType.PREMIUM },
  });

  // 2. Create post if content was stored in metadata and post hasn't been created yet
  if (metadata && metadata.content && !metadata.postId) {
    const post = await prisma.post.create({
      data: {
        content: metadata.content,
        websiteUrl: metadata.websiteUrl || null,
        status: "PUBLISHED",
        authorId: userId,
      },
    });

    // Update payment metadata with created postId to prevent duplicate post creation
    const updatedMetadata = { ...metadata, postId: post.id };
    await prisma.payment.update({
      where: { id: paymentId },
      data: { metadata: updatedMetadata },
    });

    return post;
  }

  return null;
};

const createCheckoutSessionInDB = async (
  userId: string,
  payload: ICreateCheckoutPayload
) => {
  // Fetch user to get logged-in user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const successUrl =
    payload.successUrl ||
    `${config.app_url}/payment/success?checkout_id={CHECKOUT_ID}`;

  const fullMetadata = {
    userId,
    content: payload.content || "",
    websiteUrl: payload.websiteUrl || "",
    ...payload.metadata,
  };

  // Polar SDK requires metadata values to strictly be string (min 1 char, max 500 chars), number, or boolean
  const polarMetadata: Record<string, string | number | boolean> = {
    userId: String(userId),
    content: String(payload.content || "").substring(0, 480),
  };

  if (payload.websiteUrl && payload.websiteUrl.trim().length > 0) {
    polarMetadata.websiteUrl = payload.websiteUrl.trim().substring(0, 480);
  }

  // 1. Request Polar API to create a checkout session with pre-filled customer email
  const checkout = await polarClient.checkouts.create({
    products: [payload.productId],
    successUrl: successUrl,
    customerEmail: user.email ? user.email.trim() : undefined,
    metadata: polarMetadata,
  });

  // 2. Record initial PENDING payment state in DB with full metadata
  const payment = await prisma.payment.create({
    data: {
      userId,
      checkoutId: checkout.id,
      productId: payload.productId,
      amount: checkout.totalAmount !== undefined && checkout.totalAmount !== null ? Number(checkout.totalAmount) : 0,
      currency: checkout.currency || "usd",
      status: PaymentStatus.PENDING,
      metadata: fullMetadata,
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
      const existingPayment = await prisma.payment.findUnique({
        where: { checkoutId },
      });

      if (existingPayment) {
        let updatedPayment = existingPayment;
        if (existingPayment.status !== PaymentStatus.COMPLETED) {
          updatedPayment = await prisma.payment.update({
            where: { checkoutId },
            data: {
              polarOrderId: orderId,
              status: PaymentStatus.COMPLETED,
              amount: totalAmount !== undefined && totalAmount !== null ? Number(totalAmount) : existingPayment.amount,
            },
          });
        }
        await processSuccessfulPayment(
          updatedPayment.id,
          updatedPayment.userId,
          updatedPayment.metadata || metadata
        );
      } else if (userId) {
        const newPayment = await prisma.payment.create({
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
        await processSuccessfulPayment(newPayment.id, userId, metadata);
      }
    }
  } else if (eventType === "checkout.updated") {
    const checkoutId = data.id;
    const status = data.status;

    if (checkoutId && status === "succeeded") {
      const payments = await prisma.payment.findMany({ where: { checkoutId } });
      for (const p of payments) {
        const updated = await prisma.payment.update({
          where: { id: p.id },
          data: { status: PaymentStatus.COMPLETED },
        });
        await processSuccessfulPayment(updated.id, updated.userId, updated.metadata || {});
      }
    } else if (checkoutId && (status === "failed" || status === "expired")) {
      await prisma.payment.updateMany({
        where: { checkoutId },
        data: { status: PaymentStatus.FAILED },
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

  // If status is already COMPLETED in DB, trigger post creation/user upgrade if not yet processed and return
  if (payment.status === PaymentStatus.COMPLETED) {
    await processSuccessfulPayment(payment.id, payment.userId, payment.metadata || {});
    return await prisma.payment.findUnique({ where: { id: payment.id } });
  }

  // If status is still PENDING locally, verify directly with Polar API to see if payment succeeded
  try {
    const polarCheckout: any = await polarClient.checkouts.get({ id: checkoutId });
    if (
      polarCheckout &&
      (polarCheckout.status === "succeeded" || polarCheckout.status === "confirmed")
    ) {
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.COMPLETED,
          amount:
            polarCheckout.totalAmount !== undefined && polarCheckout.totalAmount !== null
              ? Number(polarCheckout.totalAmount)
              : payment.amount,
        },
      });

      await processSuccessfulPayment(
        updatedPayment.id,
        updatedPayment.userId,
        updatedPayment.metadata || {}
      );

      return await prisma.payment.findUnique({ where: { id: payment.id } });
    } else if (
      polarCheckout &&
      (polarCheckout.status === "failed" || polarCheckout.status === "expired")
    ) {
      return await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  } catch (err) {
    console.error("Failed to query Polar API checkout status directly:", err);
  }

  return payment;
};

const getAdminPaidPostsFromDB = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          userType: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return payments;
};

const getMyPaymentsFromDB = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return payments;
};

export const paymentService = {
  createCheckoutSessionInDB,
  handlePolarWebhookInDB,
  getPaymentStatusFromDB,
  getAdminPaidPostsFromDB,
  getMyPaymentsFromDB,
};
