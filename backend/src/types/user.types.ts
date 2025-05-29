import { IUser } from "./auth.types.js";

export interface UserProfileUpdateRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UserProfileResponse {
  user: Omit<IUser, "password" | "loginAttempts" | "lockUntil">;
}
