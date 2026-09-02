import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createCheckout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const payload = req.body;

  const productId = payload.productId || process.env.POLAR_PRODUCT_ID;

  if (!productId) {
    throw new Error("productId is required. Please configure POLAR_PRODUCT_ID in server .env or pass productId in payload.");
  }

  const result = await paymentService.createCheckoutSessionInDB(
    userId,
    { ...payload, productId }
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Checkout session created successfully",
    data: result,
  });
});

const handleWebhook = catchAsync(async (req: Request, res: Response) => {
  // Use rawBody buffer attached in express.json verify or convert req.body
  const rawBody =
    (req as any).rawBody ||
    (typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body));

  const result = await paymentService.handlePolarWebhookInDB(
    req.headers,
    rawBody
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Webhook processed successfully",
    data: result,
  });
});

const getPaymentStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const checkoutId = req.params.checkoutId as string;

  const result = await paymentService.getPaymentStatusFromDB(
    userId,
    checkoutId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment status retrieved successfully",
    data: result,
  });
});

const getAdminPaidPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAdminPaidPostsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin payment records retrieved successfully",
    data: result,
  });
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await paymentService.getMyPaymentsFromDB(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User payment history retrieved successfully",
    data: result,
  });
});

export const paymentController = {
  createCheckout,
  handleWebhook,
  getPaymentStatus,
  getAdminPaidPosts,
  getMyPayments,
};
