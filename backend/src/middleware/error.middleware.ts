import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../utils/apiResponse.js";
import logger from "../utils/logger.js";

export class HttpException extends Error {
  statusCode: number;
  errors?: any;

  constructor(message: string, statusCode: number, errors?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;

    Object.setPrototypeOf(this, HttpException.prototype);
  }
}

export const errorMiddleware = (
  error: HttpException | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const statusCode = error instanceof HttpException ? error.statusCode : 500;
    const message = error.message || "Something went wrong";
    const errors = error instanceof HttpException ? error.errors : null;

    if (statusCode === 404 || statusCode === 400) {
      logger.info(
        `[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message:${message}`
      );
    } else {
      logger.error(
        `[${req.method}] ${req.path} >> StatusCode: ${statusCode}, Message: ${message}`,
        error instanceof HttpException ? error.errors : error
      );
    }

    // Don't leak error details in production
    if (process.env.NODE_ENV === "production" && statusCode === 500) {
      return res
        .status(statusCode)
        .json(ApiResponse.error("Internal Server Error", statusCode));
    }

    res.status(statusCode).json(ApiResponse.error(message, statusCode, errors));
  } catch (err) {
    // if error handling fails, return a basic error response
    logger.error("Error in errorMiddleware:", err);
    res.status(500).json(ApiResponse.error("Internal Server Error", 500));
  }
};
