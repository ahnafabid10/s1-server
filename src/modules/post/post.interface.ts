import { PostStatus } from "@prisma/client";

export interface ICreatePostInput {
  content: string;
  status?: PostStatus;
}

export interface IUpdatePostInput {
  content?: string;
  status?: PostStatus;
}
