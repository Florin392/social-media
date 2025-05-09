import express, { Application } from "express";
import cors from "cors";

import { json } from "stream/consumers";
import { environment } from "./config/environment.js";
import logger from "./utils/logger.js";
import {
  errorMiddleware,
  HttpException,
} from "./middleware/error.middleware.js";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json({ limit: "10kb" })); // limit body size for security

    this.app.use(express.urlencoded({ extended: true, limit: "10kb" })); // Parse URL-encoded bodies

    // Basic loggin middleware
    if (environment.nodeEnv === "development") {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    //Default route for API healt check
    this.app.get("/api/health", (req, res) => {
      res.status(200).json({ status: "success", message: "API is running" });
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
