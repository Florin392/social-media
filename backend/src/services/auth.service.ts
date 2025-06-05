import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { IUser, IUserPayload } from "../types/auth.types.js";
import { isStrongPassword } from "../utils/validators.js";
import { HttpException } from "../middleware/error.middleware.js";
import { User, IUserDocument } from "../models/user.model.js";
import logger from "../utils/logger.js";
import { RefreshToken } from "../models/refreshToken.model.js";
import { PasswordResetToken } from "../models/passwordReset.model.js";
import { environment } from "../config/environment.js";
import { emailService } from "./email.service.js";

export class AuthService {
  // clean utility method
  private sanitizeUserResponse(user: IUserDocument): IUser {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      password: "",
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Access and refresh Tokens generation
  private async generateTokenPair(user: IUserDocument, ipAddress: string) {
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      username: user.username,
    });

    const refreshToken = await this.generateRefreshToken(
      user._id.toString(),
      ipAddress
    );

    return { accessToken, refreshToken };
  }

  // Register a new user
  public async register(
    userData: IUser
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Validate password strength
    if (!isStrongPassword(userData.password)) {
      throw new HttpException(
        "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
        400
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username: userData.username }, { email: userData.email }],
    });
    if (existingUser) {
      throw new HttpException(
        `User already exists with this ${userData.username} or ${userData.email}`,
        400
      );
    }

    // Create new user
    const newUser = new User(userData);
    await newUser.save();

    const { accessToken, refreshToken } = await this.generateTokenPair(
      newUser,
      "127.0.0.1"
    );

    logger.info(`User registered: ${newUser.username}`);

    return {
      user: this.sanitizeUserResponse(newUser),
      token: accessToken,
      refreshToken,
    };
  }

  // Login a user
  public async login(
    username: string,
    password: string,
    ipAddress: string
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      throw new HttpException("Invalid credentials", 401);
    }

    // Check if account is locked
    if (user.isLocked && user.isLocked()) {
      throw new HttpException(
        "Account is temporarily locked due to too many failed login attempts. Try again later.",
        401
      );
    }

    // Compare passowrd
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incrementLoginAttempts();

      throw new HttpException("Invalid credentials", 401);
    }

    // Reset login attempts after successful login
    await user.resetLoginAttempts();

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokenPair(
      user,
      ipAddress
    );

    logger.info(`User logged in: ${user.username}`);

    return {
      user: this.sanitizeUserResponse(user),
      token: accessToken,
      refreshToken,
    };
  }

  // Handle Google OAuth login
  public async handleGoogleLogin(
    user: IUserDocument,
    ipAddress: string
  ): Promise<{ user: IUser; token: string; refreshToken: string }> {
    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokenPair(
      user,
      ipAddress
    );

    logger.info(`User logged in via Google: ${user.username}`);

    return {
      user: this.sanitizeUserResponse(user),
      token: accessToken,
      refreshToken,
    };
  }

  // Refresh an access token using a refresh token
  public async refreshToken(
    token: string,
    ipAddress: string
  ): Promise<{ token: string; refreshToken: string }> {
    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
      throw new HttpException("Invalid refresh token", 401);
    }

    // Check if token is expired or revoked
    if (refreshToken.expires < new Date() || refreshToken.revoked) {
      throw new HttpException("Refresh token expired or revoked", 401);
    }

    // Replace old refresh token with a new one
    const newRefreshToken = await this.generateRefreshToken(
      refreshToken.userId.toString(),
      ipAddress
    );

    // Revoke the old refresh token
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken;
    await refreshToken.save();

    // Find user
    const user = await User.findById(refreshToken.userId);

    if (!user) {
      throw new HttpException("User not found", 404);
    }

    // Generate new access token
    const accessToken = this.generateAccessToken({
      userId: user._id.toString(),
      username: user.username,
    });

    return { token: accessToken, refreshToken: newRefreshToken };
  }

  // Revoke a refresh token
  public async revokeToken(token: string, ipAddress: string): Promise<void> {
    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
      throw new HttpException("Invalid refresh token", 401);
    }

    // Revoke token
    refreshToken.revoked = new Date();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
  }

  // Request a password reset
  public async requestPasswordReset(email: string): Promise<void> {
    // Find the user by email
    const user = await User.findOne({ email });

    // if !user, the information is not revealed, "send" an email for security reasons
    if (!user) {
      logger.info(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Delete any existing reset token for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create a new reset token
    const resetToken = uuidv4();

    // Save the token to the database
    await PasswordResetToken.create({
      userId: user._id,
      token: resetToken,
    });

    // Create the reset link
    const resetLink = `${environment.clientUrl}/reset-password/${resetToken}`;

    // Send the password reset email
    await emailService.sendPasswordResetEmail(user.email, resetLink);

    logger.info(`Password reset requested for: ${email}`);
  }

  // Reset password with token
  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<void> {
    // Validate password strength
    if (!isStrongPassword(newPassword)) {
      throw new HttpException(
        "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters",
        401
      );
    }

    // Find the token in the database
    const resetToken = await PasswordResetToken.findOne({ token });

    if (!resetToken) {
      throw new HttpException("Invalid or expired reset token", 400);
    }

    // Find the user
    const user = await User.findById(resetToken.userId);
    if (!user) {
      throw new HttpException("User not found", 404);
    }

    user.password = newPassword; // update the password
    await user.save();

    // Delete the used token
    await PasswordResetToken.deleteOne({ _id: resetToken._id });

    // Revoke all refresh tokens for this user
    await RefreshToken.updateMany(
      { userId: user._id, revoked: { $exists: false } },
      { revoked: new Date(), revokedByIp: "password_reset" }
    );

    logger.info(`Password reset successfully for user: ${user.username}`);
  }

  // Generate access JWT token
  private generateAccessToken(payload: IUserPayload): string {
    return jwt.sign(payload, environment.jwtSecret, {
      expiresIn: environment.jwtExpiresIn,
    } as jwt.SignOptions);
  }

  // Generate refresh token
  private async generateRefreshToken(
    userId: string,
    ipAddress: string
  ): Promise<string> {
    // Create and save refresh token
    const refreshToken = new RefreshToken({
      userId,
      token: uuidv4(),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdByIp: ipAddress,
    });

    await refreshToken.save();

    return refreshToken.token;
  }
}
