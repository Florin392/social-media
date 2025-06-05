import nodemailer from "nodemailer";
import { environment } from "../config/environment.js";
import logger from "../utils/logger.js";

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: environment.emailHost,
      port: environment.emailPort,
      secure: environment.emailSecure,
      auth: {
        user: environment.emailUser,
        pass: environment.emailPassword,
      },
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetLink: string
  ): Promise<void> {
    try {
      const mailOptions = {
        from: environment.emailFrom,
        to: email,
        subject: "Password Reset Request",
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password. Click the link below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this password reset, please ignore this email.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error("Error sending password reset email:", error);
      throw new Error("Failed to send password reset email");
    }
  }
}

export const emailService = new EmailService();
