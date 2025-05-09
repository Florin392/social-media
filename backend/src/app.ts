import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { environment } from "./config/environment.js";
import {
  errorMiddleware,
  HttpException,
} from "./middleware/error.middleware.js";
import { configureSecurity } from "./middleware/security.middleware.js";
import logger from "./utils/logger.js";
import {
  preventParamenterPollution,
  sanitizeBody,
} from "./middleware/sanitize.middleware.js";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // security middlwares
    this.app.use(
      cors({
        origin: environment.allowedOrigins,
        credentials: true, // allow cockies
      })
    );

    // configure security headers with Helmet
    configureSecurity(this.app );

    // Parse JSON bodies
    this.app.use(express.json({ limit: "10kb" })); // limit body size for security

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true, limit: "10kb" }));

    // parse cookies
    this.app.use(cookieParser());

    // prevent parameter pollution
    this.app.use(preventParamenterPollution);

    // sanitize request body
    this.app.use(sanitizeBody);

    // Basic loggin middleware
    if (environment.nodeEnv === "development") {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
      });
    }

    // Security measure: set secure HTTP headers
    this.app.use((req, res, next) => {
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
      next();
    });
  }

  private initializeRoutes(): void {
    // Default route for API healt check
    this.app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "success",
        message: "API is running",
      });
    });

    // Test error handling
    this.app.get("/api/test-error", (req, res, next) => {
      try {
        throw new HttpException("Test error", 400, {
          field: "Test error field",
        });
      } catch (error) {}
    });

    // Default route handler
    this.app.all("*", (req, res) => {
      res.status(404).json({
        status: "error",
        message: `Cannot find ${req.originalUrl} on this server!`,
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorMiddleware);
  }
}
