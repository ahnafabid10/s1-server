import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import httpStatus from "http-status";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract token from cookie or Authorization header
      let token = req.cookies?.accessToken;

      if (!token && req.headers.authorization) {
        if (req.headers.authorization.startsWith("Bearer ")) {
          token = req.headers.authorization.split(" ")[1];
        } else {
          token = req.headers.authorization;
        }
      }

      if (!token) {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          statusCode: httpStatus.UNAUTHORIZED,
          message: "You are not authenticated. Please log in to gain access.",
        });
        return;
      }

      // 2. Verify token
      const verification = jwtUtils.verifyToken(token, config.jwt.access_secret);
      if (!verification.success || !verification.data) {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          statusCode: httpStatus.UNAUTHORIZED,
          message: verification.message || "Invalid access token. Please log in again.",
        });
        return;
      }

      const decoded = verification.data as JwtPayload & {
        id: string;
        name: string;
        email: string;
        role: Role;
      };

      // 3. Role authorization check
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        res.status(httpStatus.FORBIDDEN).json({
          success: false,
          statusCode: httpStatus.FORBIDDEN,
          message: "Forbidden: You do not have permission to access this resource.",
        });
        return;
      }

      // 4. Verify user exists in database & is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) {
        res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          statusCode: httpStatus.UNAUTHORIZED,
          message: "User associated with this token no longer exists.",
        });
        return;
      }

      if (user.activeStatus === "BLOCKED") {
        res.status(httpStatus.FORBIDDEN).json({
          success: false,
          statusCode: httpStatus.FORBIDDEN,
          message: "Your account is blocked. Please contact system support.",
        });
        return;
      }

      // 5. Attach user to request
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
};
