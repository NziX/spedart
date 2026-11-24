import { hashPassword } from "./../../utils/bcrypt";
import mongoose from "mongoose";

export interface IArtistDocument extends mongoose.Document {
  firstName: string;
  lastName: string;
  stageName: string;
  phoneNumber: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  isVerified: boolean;
  isBlocked: boolean;
  pendingWithdrawal: boolean;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  reviewedAt?: Date | null;
  reviewedBy?: mongoose.Types.ObjectId | null;
  password: string;
  verificationCode?: {
    code?: number;
    expiresAt?: Date;
  };
  paymentInfo?: {
    momo?: string;
  };
  balance: number;
  paidAmount: number;
  socials?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const artistSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    stageName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    bio: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    pendingWithdrawal: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    password: {
      type: String,
      required: true,
    },
    verificationCode: {
      code: Number,
      expiresAt: Date,
    },
    paymentInfo: {
      momo: String,
    },
    balance: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    socials: {
      facebook: String,
      twitter: String,
      instagram: String,
      youtube: String,
      website: String,
    },
  },
  {
    timestamps: true,
  },
);

artistSchema.pre("save", async function (next) {
  const artist = this as any;
  if (artist.isModified("password")) {
    artist.password = await hashPassword(artist.password);
  }
  next();
});

const Artist = mongoose.model<IArtistDocument>("Artist", artistSchema);

export default Artist;
