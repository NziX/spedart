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
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerification?: {
    code?: number;
    expiresAt?: Date;
  };
  phoneVerification?: {
    code?: number;
    expiresAt?: Date;
  };
  nationalId?: {
    idNumber?: string;
    frontImage?: string;
    backImage?: string;
    liveFacePhoto?: string;
    faceVerifiedAt?: Date;
    submittedAt?: Date;
    isVerified?: boolean;
    autoVerification?: {
      status?: "passed" | "rejected" | "manual_review_required" | "pending";
      isLegalId?: boolean;
      idDocumentType?: string;
      extractedIdNumber?: string;
      idNumberMatches?: boolean;
      documentLegalityScore?: number;
      documentLegalityReason?: string;
      isSamePerson?: boolean;
      faceMatchConfidence?: number;
      faceMatchReason?: string;
      isLivePhoto?: boolean;
      verifiedAt?: Date;
      engine?: "gemini_multimodal_ai" | "biometric_fallback";
      rejectionReason?: string | null;
    };
  };
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
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: true,
    },
    emailVerification: {
      code: Number,
      expiresAt: Date,
    },
    phoneVerification: {
      code: Number,
      expiresAt: Date,
    },
    nationalId: {
      idNumber: { type: String, default: null },
      frontImage: { type: String, default: null },
      backImage: { type: String, default: null },
      liveFacePhoto: { type: String, default: null },
      faceVerifiedAt: { type: Date, default: null },
      submittedAt: { type: Date, default: null },
      isVerified: { type: Boolean, default: false },
      autoVerification: {
        status: {
          type: String,
          enum: ["passed", "rejected", "manual_review_required", "pending"],
          default: null,
        },
        isLegalId: { type: Boolean, default: false },
        idDocumentType: { type: String, default: null },
        extractedIdNumber: { type: String, default: null },
        idNumberMatches: { type: Boolean, default: false },
        documentLegalityScore: { type: Number, default: 0 },
        documentLegalityReason: { type: String, default: null },
        isSamePerson: { type: Boolean, default: false },
        faceMatchConfidence: { type: Number, default: 0 },
        faceMatchReason: { type: String, default: null },
        isLivePhoto: { type: Boolean, default: false },
        verifiedAt: { type: Date, default: null },
        engine: { type: String, default: null },
        rejectionReason: { type: String, default: null },
      },
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
