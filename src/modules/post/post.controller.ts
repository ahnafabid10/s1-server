import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { postService } from "./post.service";
import { Role } from "@prisma/client";

const createPost = catchAsync(async (req: Request, res: Response) => {
  const authorId = req.user?.id as string;
  const result = await postService.createPostInDB(authorId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Post created successfully",
    data: result,
  });
});

const getAllPublishedPosts = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm, authorId, page, limit, sortBy, sortOrder } = req.query;

  const result = await postService.getAllPublishedPostsFromDB(
    {
      searchTerm: searchTerm as string,
      authorId: authorId as string,
    },
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Published posts retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getMyPosts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const { searchTerm, status, page, limit, sortBy, sortOrder } = req.query;

  const result = await postService.getMyPostsFromDB(
    userId,
    {
      searchTerm: searchTerm as string,
      status: status as any,
    },
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "My posts retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAdminAllPosts = catchAsync(async (req: Request, res: Response) => {
  const {
    searchTerm,
    status,
    authorId,
    startDate,
    endDate,
    page,
    limit,
    sortBy,
    sortOrder,
  } = req.query;

  const result = await postService.getAdminAllPostsFromDB(
    {
      searchTerm: searchTerm as string,
      status: status as any,
      authorId: authorId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    },
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as any,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin posts list retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await postService.getAdminStatsFromDB();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin statistics fetched successfully",
    data: stats,
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await postService.getPostByIdFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post details retrieved successfully",
    data: post,
  });
});

const updatePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const userRole = req.user?.role as Role;

  const updatedPost = await postService.updatePostInDB(
    id as string,
    userId,
    userRole,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post updated successfully",
    data: updatedPost,
  });
});

const updatePostStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const updatedPost = await postService.updatePostStatusInDB(
    id as string,
    status
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `Post status updated to ${status}`,
    data: updatedPost,
  });
});

const deletePost = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id as string;
  const userRole = req.user?.role as Role;

  const result = await postService.deletePostFromDB(
    id as string,
    userId,
    userRole
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Post deleted successfully",
    data: result,
  });
});

export const postController = {
  createPost,
  getAllPublishedPosts,
  getMyPosts,
  getAdminAllPosts,
  getAdminStats,
  getPostById,
  updatePost,
  updatePostStatus,
  deletePost,
};
