import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { postController } from "./post.controller";
import { Role } from "@prisma/client";

const router = Router();

router.post("/", auth(Role.ADMIN, Role.USER), postController.createPost);
router.get("/", postController.getAllPosts);
router.get("/my-posts", auth(Role.ADMIN, Role.USER), postController.getMyPosts);
router.get("/stats", postController.getPostStats);
router.get("/:id", postController.getSinglePost);
router.patch("/:id/click", postController.incrementClicks);
router.patch("/:id/love", postController.incrementLoves);
router.patch("/:id", auth(Role.ADMIN, Role.USER), postController.updatePost);
router.delete("/:id", auth(Role.ADMIN, Role.USER), postController.deletePost);

export const postRoutes = router;
