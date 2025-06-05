import { NextFunction, Response } from "express";
import { AuthRequest, IUserPayload } from "../types/auth.types.js";
import { HttpException } from "./error.middleware.js";
import jwt from "jsonwebtoken";
import { environment } from "../config/environment.js";

export const authenticateJWT = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get the token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer Token

    if (!token) {
      throw new HttpException("Access token is required", 401);
    }

    jwt.verify(token, environment.jwtSecret, (err: any, decoded: any) => {
      if (err) {
        //Handle specific JWT errors with appropiate responses
        if (err.name === "TokenExpiredError") {
          throw new HttpException("Token expired", 401);
        } else if (err.name === "JsonWebTokenError") {
          throw new HttpException("Invalid token", 401);
        } else {
          throw new HttpException("Authentication failed", 401);
        }
      }

      req.user = decoded as IUserPayload;
      next();
    });
  } catch (error) {
    next(error);
  }
};
