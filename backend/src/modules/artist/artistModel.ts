import { hashPassword } from "./../../utils/bcrypt";
import mongoose from "mongoose";

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
  const artist = this;
  if (artist.isModified("password")) {
    artist.password = await hashPassword(artist.password);
  }
  next();
});

const Artist = mongoose.model("Artist", artistSchema);

export default Artist;
