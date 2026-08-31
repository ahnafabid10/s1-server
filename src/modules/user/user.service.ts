import { ActiveStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { IUpdateProfile, IUserFilterOptions } from "./user.interface";

const getAllUsersFromDB = async (
  filters: IUserFilterOptions,
  options: { page?: number; limit?: number }
) => {
  const { searchTerm, role, activeStatus } = filters;
  const page = Number(options.page) > 0 ? Number(options.page) : 1;
  const limit = Number(options.limit) > 0 ? Number(options.limit) : 10;
  const skip = (page - 1) * limit;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
      ],
    });
  }

  if (role) {
    andConditions.push({ role });
  }

  if (activeStatus) {
    andConditions.push({ activeStatus });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const users = await prisma.user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

const updateProfileInDB = async (userId: string, payload: IUpdateProfile) => {
  const { name, profilePhoto, bio } = payload;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name: name.trim() }),
      profile: {
        upsert: {
          create: {
            profilePhoto: profilePhoto || null,
            bio: bio || null,
          },
          update: {
            ...(profilePhoto !== undefined && { profilePhoto }),
            ...(bio !== undefined && { bio }),
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      profile: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserStatusInDB = async (userId: string, activeStatus: ActiveStatus) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { activeStatus },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      updatedAt: true,
    },
  });

  return user;
};

const updateUserRoleInDB = async (userId: string, role: Role) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      activeStatus: true,
      updatedAt: true,
    },
  });

  return user;
};

export const userService = {
  getAllUsersFromDB,
  getUserByIdFromDB,
  updateProfileInDB,
  updateUserStatusInDB,
  updateUserRoleInDB,
};
