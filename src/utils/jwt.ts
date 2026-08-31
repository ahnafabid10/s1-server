import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

export interface IJwtUserPayload {
  id: string;
  name: string;
  email: string;
  role: string;
}

const createToken = (
  payload: IJwtUserPayload,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn,
  } as SignOptions);
};

const verifyToken = (
  token: string,
  secret: string
): { success: boolean; data?: JwtPayload | string; message?: string } => {
  try {
    const verified = jwt.verify(token, secret);
    return {
      success: true,
      data: verified,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Invalid token",
    };
  }
};

export const jwtUtils = {
  createToken,
  verifyToken,
};
