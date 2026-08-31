import { ErrorRequestHandler } from "express";
import httpStatus from "http-status";

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";
  const errorDetails = err;

  // Handle Prisma Known Request Errors
  if (err.name === "PrismaClientKnownRequestError") {
    if (err.code === "P2002") {
      statusCode = httpStatus.CONFLICT;
      message = "A record with this field value already exists.";
    } else if (err.code === "P2025") {
      statusCode = httpStatus.NOT_FOUND;
      message = "Record to perform operation on does not exist.";
    }
  } else if (err.name === "PrismaClientValidationError") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Database schema validation error.";
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error: process.env.NODE_ENV === "development" ? errorDetails : undefined,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
