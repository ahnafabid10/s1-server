import { NextFunction, Request, RequestHandler, Response } from "express";
import httpStatus from "http-status";

export const catchAsync = (Fn: RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Fn(req, res, next);
    } catch (error) {
      console.error("Error executing request:", error);

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        status: httpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
};
