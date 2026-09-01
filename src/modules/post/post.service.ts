import { prisma } from "../../lib/prisma";
import { ICreatePostInput, IUpdatePostInput } from "./post.interface";

const createPostInDB = async (
  authorId: string,
  userRole: string | undefined,
  payload: ICreatePostInput
) => {
  // Regular user posts always default to PENDING. Admins can optionally set status if provided.
  const postStatus = userRole === "ADMIN" && payload.status ? payload.status : "PENDING";

  const post = await prisma.post.create({
    data: {
      content: payload.content,
      websiteUrl: payload.websiteUrl || null,
      status: postStatus,
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

const getAllPostsFromDB = async (query?: { admin?: string; status?: string }) => {
  const where: any = {};

  if (query?.admin === "true") {
    if (query?.status && query.status.toLowerCase() !== "all") {
      where.status = query.status.toUpperCase();
    }
  } else {
    // Public feed: strictly show ONLY approved (PUBLISHED) posts!
    where.status = "PUBLISHED";
  }

  const posts = await prisma.post.findMany({
    where,
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

const incrementClicksInDB = async (id: string) => {
  return await prisma.post.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });
};

const incrementLovesInDB = async (id: string) => {
  return await prisma.post.update({
    where: { id },
    data: { loves: { increment: 1 } },
  });
};

export const postService = {
  createPostInDB,
  getAllPostsFromDB,
  getMyPostsFromDB,
  getSinglePostFromDB,
  updatePostInDB,
  deletePostInDB,
  getPostStatsFromDB,
  incrementClicksInDB,
  incrementLovesInDB,
};
