import express from "express";
import { userController } from "./user.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/", auth(Role.ADMIN), userController.getAllUsers);
router.get("/profile", auth(), userController.updateProfile);
router.patch("/profile", auth(), userController.updateProfile);
router.get("/:id", auth(), userController.getUserById);
router.patch("/:id/status", auth(Role.ADMIN), userController.updateUserStatus);
router.patch("/:id/role", auth(Role.ADMIN), userController.updateUserRole);

export const userRoutes = router;
