import { PostStatus } from "@prisma/client";

export interface ICreatePost {
  content: string;
  status?: PostStatus;
}

export interface IUpdatePost {
  content?: string;
  status?: PostStatus;
}

export interface IPostFilters {
  searchTerm?: string;
  status?: PostStatus;
  authorId?: string;
  startDate?: string;
  endDate?: string;
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
