import { App } from "./app.js";
import { connectDB } from "./config/database.js";
import { environment } from "./config/environment.js";
import logger from "./utils/logger.js";

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const app = new App().app;

    const server = app.listen(environment.port, () => {
      logger.info(
        `Server is running in ${environment.nodeEnv} mode on port ${environment.port}`
      );
    });

    process.on("unhandledRejection", (err: Error) => {
      logger.error("UNHANDLED REJECTION! Shutting down...");
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();
