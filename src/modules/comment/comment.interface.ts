import { CommentStatus } from "@prisma/client";

export interface ICreateComment {
  content: string;
  postId: string;
}

export interface IUpdateComment {
  content?: string;
  status?: CommentStatus;
}
