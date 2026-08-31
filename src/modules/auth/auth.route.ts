import express from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.post("/refresh-token", authController.refreshToken);
router.get("/me", auth(), authController.getMe);
router.post("/logout", authController.logout);

export const authRoutes = router;
