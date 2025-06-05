import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "../types/auth.types.js";
import bcrypt from "bcrypt";

export interface IUserDocument extends Omit<IUser, "_id">, Document {
  _id: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  isLocked(): boolean;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Constants for account locking
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 30 * 60 * 1000; // 30 min

// Pre-save hook to hash password
UserSchema.pre<IUserDocument>("save", async function (next) {
  // Hash only new or modified passwords
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error("An unknown error occurred while hashing the password."));
    }
  }
});

// Compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
UserSchema.methods.isLocked = function (): boolean {
  // check for any past locks
  if (this.lockUntil && this.lockUntil > new Date()) {
    return true;
  }
  return false;
};

// Increment login attempts and lock account if necessary
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  // Increment login attempts
  this.loginAttempts += 1;

  // Lock account if max attempts is reached
  if (this.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    this.lockUntil = new Date(Date.now() + LOCK_TIME);
  }
  await this.save();
};

// Reset login attempts after successfull login
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = null;
  this.lastLogin = new Date();

  await this.save();
};

export const User = mongoose.model<IUserDocument>("User", UserSchema);
