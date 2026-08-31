import { prisma } from "../../lib/prisma";
import { ICreatePostInput, IUpdatePostInput } from "./post.interface";

const createPostInDB = async (authorId: string, payload: ICreatePostInput) => {
  const post = await prisma.post.create({
    data: {
      ...payload,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
  });

  return post;
};

const getAllPostsFromDB = async () => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};

const getMyPostsFromDB = async (authorId: string) => {
  const posts = await prisma.post.findMany({
    where: {
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return posts;
};

const getSinglePostFromDB = async (id: string) => {
  const post = await prisma.post.findUnique({
    where: {
      id,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
  });

  return post;
};

const updatePostInDB = async (
  id: string,
  userId: string,
  userRole: string,
  payload: IUpdatePostInput
) => {
  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("You are not authorized to update this post");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: payload,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profilePhoto: true,
        },
      },
    },
  });

  return updatedPost;
};

const deletePostInDB = async (id: string, userId: string, userRole: string) => {
  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.authorId !== userId && userRole !== "ADMIN") {
    throw new Error("You are not authorized to delete this post");
  }

  const deletedPost = await prisma.post.delete({
    where: { id },
  });

  return deletedPost;
};

const getPostStatsFromDB = async () => {
  const [totalPosts, publishedPosts, draftPosts, pendingPosts, totalUsers] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: "PUBLISHED" } }),
      prisma.post.count({ where: { status: "DRAFT" } }),
      prisma.post.count({ where: { status: "PENDING" } }),
      prisma.user.count(),
    ]);

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    pendingPosts,
    totalUsers,
  };
};

export const postService = {
  createPostInDB,
  getAllPostsFromDB,
  getMyPostsFromDB,
  getSinglePostFromDB,
  updatePostInDB,
  deletePostInDB,
  getPostStatsFromDB,
};
