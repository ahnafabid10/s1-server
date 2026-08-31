import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ICreateComment, IUpdateComment } from "./comment.interface";

const createCommentInDB = async (authorId: string, payload: ICreateComment) => {
  const { content, postId } = payload;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    throw new Error("Target post does not exist.");
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
    },
  });

  return comment;
};

const getCommentsByPostIdFromDB = async (postId: string) => {
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
    },
  });

  return comments;
};

const updateCommentInDB = async (
  id: string,
  userId: string,
  userRole: Role,
  payload: IUpdateComment
) => {
  const existingComment = await prisma.comment.findUnique({ where: { id } });
  if (!existingComment) {
    throw new Error("Comment not found.");
  }

  if (existingComment.authorId !== userId && userRole !== Role.ADMIN) {
    throw new Error("You do not have permission to modify this comment.");
  }

  const updatedComment = await prisma.comment.update({
    where: { id },
    data: payload,
  });

  return updatedComment;
};

const deleteCommentFromDB = async (
  id: string,
  userId: string,
  userRole: Role
) => {
  const existingComment = await prisma.comment.findUnique({ where: { id } });
  if (!existingComment) {
    throw new Error("Comment not found.");
  }

  if (existingComment.authorId !== userId && userRole !== Role.ADMIN) {
    throw new Error("You do not have permission to delete this comment.");
  }

  const deletedComment = await prisma.comment.delete({ where: { id } });
  return deletedComment;
};

export const commentService = {
  createCommentInDB,
  getCommentsByPostIdFromDB,
  updateCommentInDB,
  deleteCommentFromDB,
};
