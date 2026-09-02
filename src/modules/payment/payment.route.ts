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

export const paymentRoutes = router;
