import mongoose from "mongoose";
import logger from "../utils/logger.js";
import { environment } from "./environment.js";

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set("strictQuery", false);

    await mongoose.connect(environment.mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
