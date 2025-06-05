import mongoose, { Schema, Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  token: string;
  expires: Date;
  createdByIp: string;
  revoked?: Date;
  revokedByIp?: string;
  replacedByToken?: string;
  isActive: boolean;
  isExpired: boolean;
}

const RefreshTokenSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expires: {
    type: Date,
    required: true,
  },
  createdByIp: {
    type: String,
    required: true,
  },
  revoked: {
    type: Date,
  },
  revokedByIp: {
    type: String,
  },
  replacedByToken: {
    type: String,
  },
  isActive: {
    type: Boolean,
    get: function (this: IRefreshToken) {
      return !this.revoked && !this.isExpired;
    },
    virtual: true,
  },
  isExpired: {
    type: Boolean,
    get: function (this: IRefreshToken) {
      return Date.now() >= this.expires.getTime();
    },
    virtual: true,
  },
});

// Indexes for fast queries
RefreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model<IRefreshToken>(
  "RefreshToken",
  RefreshTokenSchema
);
