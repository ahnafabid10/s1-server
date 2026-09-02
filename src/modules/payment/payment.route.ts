import { Router } from "express";
import { Role } from "@prisma/client";
import { auth } from "../../middlewares/auth";
import { paymentController } from "./payment.controller";

const router = Router();

// Create checkout session (Protected)
router.post(
  "/create-checkout",
  auth(Role.USER, Role.ADMIN),
  paymentController.createCheckout
);

// Polar Webhook ingestion endpoint (Public, verified via Cryptographic HMAC signature)
router.post("/webhook", paymentController.handleWebhook);

// Check payment status from DB (Protected)
router.get(
  "/status/:checkoutId",
  auth(Role.USER, Role.ADMIN),
  paymentController.getPaymentStatus
);

// User: Get logged-in user's payment history (Protected)
router.get(
  "/my-payments",
  auth(Role.USER, Role.ADMIN),
  paymentController.getMyPayments
);

// Admin: Get all paid posts & payment transactions (Protected Admin)
router.get(
  "/admin/paid-posts",
  auth(Role.ADMIN),
  paymentController.getAdminPaidPosts
);

export const paymentRoutes = router;
