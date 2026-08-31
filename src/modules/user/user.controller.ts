import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { userService } from "./user.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { searchTerm, role, activeStatus, page, limit } = req.query;

  const result = await userService.getAllUsersFromDB(
    {
      searchTerm: searchTerm as string,
      role: role as any,
      activeStatus: activeStatus as any,
    },
    {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getUserByIdFromDB(id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const updatedUser = await userService.updateProfileInDB(userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { activeStatus } = req.body;

  const updatedUser = await userService.updateUserStatusInDB(
    id as string,
    activeStatus
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User status updated to ${activeStatus}`,
    data: updatedUser,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const updatedUser = await userService.updateUserRoleInDB(id as string, role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User role updated to ${role}`,
    data: updatedUser,
  });
});

export const userController = {
  getAllUsers,
  getUserById,
  updateProfile,
  updateUserStatus,
  updateUserRole,
};
