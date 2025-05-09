import { NextFunction, Request, Response } from "express";
import { hasNoSqlInjection, sanitizeHtml } from "../utils/validators.js";
import logger from "../utils/logger.js";
import { HttpException } from "./error.middleware.js";

// sanitize request body to prevent XSS attacks
export const sanitizeBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    for (const key in req.body) {
      // sanitize only string values
      if (typeof req.body[key] === "string") {
        // check for SQL injection attempts
        if (hasNoSqlInjection(req.body[key])) {
          logger.warn(
            `Possible SQL injection attempt detected from IP: ${req.ip}`,
            {
              path: req.path,
              body: req.body,
            }
          );
          return next(new HttpException("Invalid input detected", 400));
        }

        //Sanitize HTML content
        req.body[key] = sanitizeHtml(req.body[key]);
      } else if (typeof req.body[key] === "object" && req.body[key] !== null) {
        // check for NoSQL injection
        if (hasNoSqlInjection(req.body[key])) {
          logger.warn(
            `Possible NoSQL injection attempt detected from IP: ${req.ip}`,
            {
              path: req.path,
              body: req.body,
            }
          );

          return next(new HttpException("Invalid input detected", 400));
        }
      }
    }
  }
  next();
};

// protect against HTTP Parameter Pollution
export const preventParamenterPollution = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //handle query parameters
  if (req.query) {
    for (const key in req.query) {
      // if a parameter appears multiple times, keep only the last value
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
};
