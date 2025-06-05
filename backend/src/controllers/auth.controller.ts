import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { getClientIp } from "../utils/validators.js";
import { IUserDocument } from "../models/user.model.js";
import { AuthRequest } from "../types/auth.types.js";

export class AuthController {
  private authService = new AuthService();

  private setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "strict",
      path: "/api/auth/refresh-token",
    });
  }

  // Register a new user
  public register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { username, email, password } = req.body;
      const result = await this.authService.register({
        username,
        email,
        password,
      });

      // Set refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      res
        .status(201)
        .json(
          ApiResponse.success(
            { user: result.user, token: result.token },
            "User registered successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  };

  // Login a user
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { username, password } = req.body;
      const ipAddress = getClientIp(req);

      const result = await this.authService.login(
        username,
        password,
        ipAddress
      );

      // Set refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      res
        .status(200)
        .json(
          ApiResponse.success(
            { user: result.user, token: result.token },
            "User logged in successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  };

  // Refresh access token
  public refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const ipAddress = getClientIp(req);

      if (!refreshToken) {
        return next(new Error("Refresh token is required"));
      }

      const result = await this.authService.refreshToken(
        refreshToken,
        ipAddress
      );

      // Set new refresh token as HTTP-only cookie
      this.setRefreshTokenCookie(res, result.refreshToken);

      res
        .status(200)
        .json(
          ApiResponse.success(
            { token: result.token },
            "Token refreshed successfully"
          )
        );
    } catch (error) {
      next(error);
    }
  };

  // Logout user
  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Get refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const ipAddress = getClientIp(req);

      if (refreshToken) {
        // Revoke the refresh token
        await this.authService.revokeToken(refreshToken, ipAddress);
      }

      // Clear refresh token cookie
      res.cookie("refreshToken", "", {
        httpOnly: true,
        expires: new Date(0),
      });

      res
        .status(200)
        .json(ApiResponse.success(null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  };

  // Request password reset
  public requestPasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { email } = req.body;

      await this.authService.requestPasswordReset(email);

      // Always return success even if email doesn't exist
      res
        .status(200)
        .json(
          ApiResponse.success(
            null,
            "If your email is registered, you will receive a password reset link"
          )
        );
    } catch (error) {
      next(error);
    }
  };

  // Reset password with token
  public resetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { token, password } = req.body;

      await this.authService.resetPassword(token, password);

      res
        .status(200)
        .json(
          ApiResponse.success(null, "Password has been reset successfully")
        );
    } catch (error) {
      next(error);
    }
  };

  // Google OAuth callback handler
  public googleCallback = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user as IUserDocument;
      const ipAddress = getClientIp(req);

      if (!user) {
        return res.redirect("/login?error=authentication_failed");
      }

      const result = await this.authService.handleGoogleLogin(user, ipAddress);

      // Redirect to frontend with token, redirect to a callback page
      return res.redirect(
        `${process.env.CLIENT_URL}/oauth-callback?token=${result.token}&refreshToken=${result.refreshToken}`
      );
    } catch (error) {
      next(error);
    }
  };
}
