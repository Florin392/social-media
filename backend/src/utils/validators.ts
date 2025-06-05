import { Request } from "express";
import { body } from "express-validator";

// Validate password strength - min 8 char, at least 1 uppercase, 1 lowercase, 1 number, 1 special char
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumbers &&
    hasSpecialChar
  );
};

// Sanitize HTML content to prevent XSS attacks
export const sanitizeHtml = (html: string): string => {
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Detect and block common SQL injection patterns
export const hasSqlInjection = (value: string): boolean => {
  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|CREATE|WHERE)\s/i,
    /(\s|^)(AND|OR)(\s|\().*=.*(\s|\))/i,
    /--/,
    /;.*/,
    /\/\*.+\*\//,
  ];

  return sqlPatterns.some((pattern) => pattern.test(value));
};

// Validate MongoDB ObjectId format
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Check for common NoSQL injection patterns
export const hasNoSqlInjection = (obj: any): boolean => {
  const str = JSON.stringify(obj); // convert object to string to check for operators

  // Check for MongoDB operators
  const hasOperators =
    /([$]gt|[$]lt|[$]gte|[$]lte|[$]ne|[$]in|[$]nin|[$]exists|[$]regex)/i.test(
      str
    );

  // Check for JavaScript execution attempts
  const hasCodeExecution = /([$]where|[$]function|[$]eval|[$]exec)/i.test(str);

  return hasOperators || hasCodeExecution;
};

// Helper to get client IP address from request
export const getClientIp = (req: Request): string => {
  return (
    (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""
  );
};

// validation rules
export const validationRules = {
  username: () =>
    body("username")
      .isString()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage("Username must be between 3 and 20 characters")
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage(
        "Username can only contain letters, numbers, and underscores"
      ),
  email: () =>
    body("email")
      .isEmail()
      .withMessage("Must be a valid email address")
      .normalizeEmail(),
  password: () =>
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage(
        "Password must include lowercase letter, uppercase letter, number, and special character"
      ),
  token: () =>
    body("token").isString().notEmpty().withMessage("Token is required"),

  requiredString: (field: string) =>
    body(field).isString().notEmpty().withMessage(`${field} is required`),
};
