import { PostStatus } from "@prisma/client";

export interface ICreatePostInput {
  content: string;
  websiteUrl?: string;
  status?: PostStatus;
}

export interface IUpdatePostInput {
  content?: string;
  websiteUrl?: string;
  status?: PostStatus;
}
