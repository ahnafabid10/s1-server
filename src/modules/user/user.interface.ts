import { Role } from "@prisma/client";

export interface RegisterUserPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
  profilePhoto?: string;
}
