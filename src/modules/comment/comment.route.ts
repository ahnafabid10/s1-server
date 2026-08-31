import express from "express";
import { commentController } from "./comment.controller";
import { auth } from "../../middlewares/auth";

const router = express.Router();

router.post("/", auth(), commentController.createComment);
router.get("/post/:postId", commentController.getCommentsByPostId);
router.patch("/:id", auth(), commentController.updateComment);
router.delete("/:id", auth(), commentController.deleteComment);

export const commentRoutes = router;
