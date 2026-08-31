import { ActiveStatus, Role } from "@prisma/client";

export interface IUpdateProfile {
  name?: string;
  profilePhoto?: string;
  bio?: string;
}

export interface IUserFilterOptions {
  searchTerm?: string;
  role?: Role;
  activeStatus?: ActiveStatus;
}
