import express from "express";
import { postController } from "./post.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// Specific routes first to prevent :id param collisions
router.get("/my-posts", auth(), postController.getMyPosts);
router.get("/admin/stats", auth(Role.ADMIN), postController.getAdminStats);
router.get("/admin/all", auth(Role.ADMIN), postController.getAdminAllPosts);

// Public / General routes
router.post("/", auth(), postController.createPost);
router.get("/", postController.getAllPublishedPosts);
router.get("/:id", postController.getPostById);
router.patch("/:id", auth(), postController.updatePost);
router.patch("/:id/status", auth(Role.ADMIN), postController.updatePostStatus);
router.delete("/:id", auth(), postController.deletePost);

export const postRoutes = router;
