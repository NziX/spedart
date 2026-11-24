import { atom } from "recoil";
import { Art } from "@/types";

export const activeOnboardingStepState = atom<
  "registration" | "verification" | "artist_journey" | "profile" | "awaiting_approval"
>({
  key: "ActiveOnboardingStepState",
  default: "registration",
});

export const verificationState = atom<{
  email: string;
  phoneNumber?: string;
  isEmailVerified: boolean;
  isPhoneVerified?: boolean;
  devCode?: number | string;
}>({
  key: "VerificationState",
  default: {
    email: "",
    phoneNumber: "",
    isEmailVerified: false,
    isPhoneVerified: true,
    devCode: undefined,
  },
});

export const onboardingDataState = atom<{
  journey?: string;
  profilePicture?: string;
}>({
  key: "OnboardingDataState",
  default: {},
});

export const activeResetPasswordStepState = atom<"email" | "code" | "password">(
  {
    key: "ActiveResetPasswordStepState",
    default: "email",
  },
);

export const paymentState = atom<"SUCCESSFUL" | "FAILED">({
  key: "PaymentState",
  default: "FAILED",
});

export const showShareSongModalState = atom<{
  song: Art;
  show: boolean;
} | null>({
  key: "ShowShareModalState",
  default: null,
});

export const showShareProfileState = atom<{
  artistId: string;
  show: boolean;
} | null>({
  key: "ShowShareProfileState",
  default: null,
});

export const showBalanceState = atom<{
  artistId: string;
  show: boolean;
} | null>({
  key: "ShowBalanceState",
  default: null,
});
