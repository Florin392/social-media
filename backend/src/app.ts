import express, { Application } from "express";
import cors from "cors";

import { json } from "stream/consumers";
import { environment } from "./config/environment.js";
import logger from "./utils/logger.js";

export class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
  }

  private initializeMiddlewares(): void {
    this.app.use(express.json({ limit: "10kb" })); // limit body size for security

    this.app.use(express.urlencoded({ extended: true, limit: "10kb" }));

    if (environment.nodeEnv === "development") {
      this.app.use((req, res, next) => {
        logger.debug(`${req.method} ${req.path}`);
        next();
      });
    }
  }

  private initializeRoutes(): void {
    this.app.get("/api/health", (req, res) => {
      res.status(200).json({ status: "success", message: "API is running" });
    });

    this.app.all("*", (req, res) => {
      res.status(404).json({
        status: "error",
        message: `Cannot find ${req.originalUrl} on this server!`,
      });
    });
  }
}
