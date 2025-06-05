import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const environment = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017",
  jwtSecret:
    process.env.JWT_SECRET ||
    "D>,S^w-v%m>IU6xm5'U#2(% oU|yU:9qk^S>^E]mJ-0n[I(H97",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS || "http://localhost:5173"
  ).split(","),
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "15", 10), //in minutes
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10), // max requests per window
  emailHost: process.env.EMAIL_HOST || "smtp.mailtrap.io",
  emailPort: parseInt(process.env.EMAIL_PORT || "2525", 10),
  emailSecure: process.env.EMAIL_SECURE === "true",
  emailUser: process.env.EMAIL_USER || "",
  emailPassword: process.env.EMAIL_PASSWORD || "",
  emailFrom: process.env.EMAIL_FROM || "noreply@socialmedia.com",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleCallbackUrl:
    process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:3000/api/auth/google/callback",
};
