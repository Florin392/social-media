import { Request, Response, NextFunction } from "express";
import { ValidationChain, validationResult } from "express-validator";
import { HttpException } from "./error.middleware.js";

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors for better readability
    const formattedErrors = errors.array().map((error) => ({
      field: error.type === "field" ? error.path : "unknown",
      message: error.msg,
      value: error.type === "field" ? error.value : undefined,
    }));

    throw new HttpException(
      `Validation failed: ${formattedErrors.map((e) => e.message).join(", ")}`,
      400
    );
  };
};
