import { PostStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  ICreatePost,
  IPaginationOptions,
  IPostFilters,
  IUpdatePost,
} from "./post.interface";

const createPostInDB = async (authorId: string, payload: ICreatePost) => {
  const { content, status } = payload;

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      status: status || PostStatus.PUBLISHED,
      authorId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
    },
  });

  return post;
};

const getAllPublishedPostsFromDB = async (
  filters: IPostFilters,
  options: IPaginationOptions
) => {
  const { searchTerm, authorId } = filters;
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  const andConditions: Prisma.PostWhereInput[] = [
    { status: PostStatus.PUBLISHED },
  ];

  if (searchTerm) {
    andConditions.push({
      content: { contains: searchTerm, mode: "insensitive" },
    });
  }

  if (authorId) {
    andConditions.push({ authorId });
  }

  const whereConditions: Prisma.PostWhereInput = { AND: andConditions };

  const posts = await prisma.post.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const total = await prisma.post.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: posts,
  };
};

const getMyPostsFromDB = async (
  userId: string,
  filters: IPostFilters,
  options: IPaginationOptions
) => {
  const { searchTerm, status } = filters;
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  const andConditions: Prisma.PostWhereInput[] = [{ authorId: userId }];

  if (searchTerm) {
    andConditions.push({
      content: { contains: searchTerm, mode: "insensitive" },
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  const whereConditions: Prisma.PostWhereInput = { AND: andConditions };

  const posts = await prisma.post.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const total = await prisma.post.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: posts,
  };
};

const getAdminAllPostsFromDB = async (
  filters: IPostFilters,
  options: IPaginationOptions
) => {
  const { searchTerm, status, authorId, startDate, endDate } = filters;
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";

  const andConditions: Prisma.PostWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { content: { contains: searchTerm, mode: "insensitive" } },
        { author: { email: { contains: searchTerm, mode: "insensitive" } } },
        { author: { name: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  if (status) {
    andConditions.push({ status });
  }

  if (authorId) {
    andConditions.push({ authorId });
  }

  if (startDate || endDate) {
    andConditions.push({
      createdAt: {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      },
    });
  }

  const whereConditions: Prisma.PostWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const posts = await prisma.post.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const total = await prisma.post.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: posts,
  };
};

const getAdminStatsFromDB = async () => {
  const [total, published, draft, pending, archived, usersCount] =
    await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.post.count({ where: { status: PostStatus.PENDING } }),
      prisma.post.count({ where: { status: PostStatus.ARCHIVED } }),
      prisma.user.count(),
    ]);

  return {
    posts: {
      total,
      published,
      draft,
      pending,
      archived,
    },
    users: {
      total: usersCount,
    },
  };
};

const getPostByIdFromDB = async (id: string) => {
  // Increment view count
  const post = await prisma.post.update({
    where: { id },
    data: { views: { increment: 1 } },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profile: {
            select: {
              profilePhoto: true,
            },
          },
        },
      },
      comments: {
        where: { status: "APPROVED" },
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
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  return post;
};

const updatePostInDB = async (
  id: string,
  userId: string,
  userRole: Role,
  payload: IUpdatePost
) => {
  const existingPost = await prisma.post.findUnique({ where: { id } });

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  // Only the author or an admin can update the post
  if (existingPost.authorId !== userId && userRole !== Role.ADMIN) {
    throw new Error("You do not have permission to modify this post.");
  }

  const { content, status } = payload;

  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      ...(content && { content: content.trim() }),
      ...(status && { status }),
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return updatedPost;
};

const updatePostStatusInDB = async (id: string, status: PostStatus) => {
  const post = await prisma.post.update({
    where: { id },
    data: { status },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return post;
};

const deletePostFromDB = async (id: string, userId: string, userRole: Role) => {
  const existingPost = await prisma.post.findUnique({ where: { id } });

  if (!existingPost) {
    throw new Error("Post not found.");
  }

  if (existingPost.authorId !== userId && userRole !== Role.ADMIN) {
    throw new Error("You do not have permission to delete this post.");
  }

  const deletedPost = await prisma.post.delete({ where: { id } });
  return deletedPost;
};

export const postService = {
  createPostInDB,
  getAllPublishedPostsFromDB,
  getMyPostsFromDB,
  getAdminAllPostsFromDB,
  getAdminStatsFromDB,
  getPostByIdFromDB,
  updatePostInDB,
  updatePostStatusInDB,
  deletePostFromDB,
};
