import { Response } from "express";

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPage?: number;
}

export interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: IMeta;
  data: T;
}

export const sendResponse = <T>(res: Response, responseData: IApiResponse<T>): void => {
  res.status(responseData.statusCode).json({
    success: responseData.success,
    statusCode: responseData.statusCode,
    message: responseData.message || "Operation successful",
    meta: responseData.meta,
    data: responseData.data,
  });
};
