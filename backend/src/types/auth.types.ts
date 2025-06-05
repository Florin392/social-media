import { Request } from "express";

export interface IUser {
  _id?: string;
  username: string;
  email: string;
  password: string;
  googleId?: string;
  isEmailVerified?: boolean;
  loginAttempts?: number;
  lockUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPayload {
  userId: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: IUserPayload;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<IUser, "password">;
  token: string;
  refreshToken?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}
