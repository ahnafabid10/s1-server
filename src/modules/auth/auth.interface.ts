import { Role } from "@prisma/client";

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: Role;
  profilePhoto?: string;
  bio?: string;
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    profilePhoto?: string | null;
  };
}
