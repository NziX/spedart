import React, { useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { activeOnboardingStepState, verificationState } from "@/atoms";
import axios from "@/lib/axios.config";
import { notifications } from "@mantine/notifications";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function Verification() {
  const [activeStep, setActiveStep] = useRecoilState(activeOnboardingStepState);
  const [vData, setVData] = useRecoilState(verificationState);

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  const [customEmail, setCustomEmail] = useState("");
  const [customPhone, setCustomPhone] = useState("");

  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);

  const [emailCooldown, setEmailCooldown] = useState(0);
  const [phoneCooldown, setPhoneCooldown] = useState(0);

  // Restore from localStorage if recoil atom is empty on page refresh
  useEffect(() => {
    if (!vData.email && typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingVerification");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setVData(parsed);
          if (parsed.email) setCustomEmail(parsed.email);
          if (parsed.phoneNumber) setCustomPhone(parsed.phoneNumber);
        } catch (e) {
          console.error("Error reading stored verification:", e);
        }
      }
    } else {
      if (vData.email) setCustomEmail(vData.email);
      if (vData.phoneNumber) setCustomPhone(vData.phoneNumber);
    }
  }, [vData.email, setVData]);

  // Countdown timers for resend buttons
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0 || phoneCooldown > 0) {
      timer = setInterval(() => {
        setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown, phoneCooldown]);

  const activeEmail = vData.email || customEmail;
  const activePhone = vData.phoneNumber || customPhone;

  // Auto transition when both become verified
  useEffect(() => {
    if (vData.isEmailVerified && vData.isPhoneVerified) {
      const timeout = setTimeout(() => {
        setActiveStep("awaiting_approval");
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [vData.isEmailVerified, vData.isPhoneVerified, setActiveStep]);

  const updateStoredVerification = (
    updated: Partial<typeof vData>
  ) => {
    const next = { ...vData, ...updated };
    setVData(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingVerification", JSON.stringify(next));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmail) {
      notifications.show({
        message: "Please enter your email address.",
        color: "red",
      });
      return;
    }
    if (!emailCode || emailCode.trim().length < 4) {
      notifications.show({
        message: "Please enter the verification code sent to your email.",
        color: "red",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      const { data } = await axios.post("/artists/verify-email", {
        email: activeEmail.trim(),
        code: emailCode.trim(),
      });
      notifications.show({
        title: "Email Verified",
        message: data.message || "Your email address has been successfully verified!",
        color: "teal",
      });
      updateStoredVerification({
        isEmailVerified: true,
        email: activeEmail.trim(),
      });
    } catch (error: any) {
      notifications.show({
        title: "Verification Failed",
        message:
          error?.response?.data?.message ||
          "Invalid or expired verification code. Please try again.",
        color: "red",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEmail && !activePhone) {
      notifications.show({
        message: "Please enter your phone number.",
        color: "red",
      });
      return;
    }
    if (!phoneCode || phoneCode.trim().length < 4) {
      notifications.show({
        message: "Please enter the verification code sent to your phone.",
        color: "red",
      });
      return;
    }

    setVerifyingPhone(true);
    try {
      const { data } = await axios.post("/artists/verify-phone", {
        email: activeEmail.trim() || undefined,
        phoneNumber: activePhone.trim() || undefined,
        code: phoneCode.trim(),
      });
      notifications.show({
        title: "Phone Verified",
        message: data.message || "Your phone number has been successfully verified!",
        color: "teal",
      });
      updateStoredVerification({
        isPhoneVerified: true,
        phoneNumber: activePhone.trim(),
      });
    } catch (error: any) {
      notifications.show({
        title: "Verification Failed",
        message:
          error?.response?.data?.message ||
          "Invalid or expired verification code. Please try again.",
        color: "red",
      });
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleResendEmail = async () => {
    if (!activeEmail) {
      notifications.show({
        message: "Please enter your email to resend code.",
        color: "red",
      });
      return;
    }
    setResendingEmail(true);
    try {
      const { data } = await axios.post("/artists/resend-email-code", {
        email: activeEmail.trim(),
      });
      notifications.show({
        title: "Code Sent",
        message: data.message || "A new verification code has been sent to your email.",
        color: "teal",
      });
      setEmailCooldown(60);
    } catch (error: any) {
      notifications.show({
        title: "Resend Failed",
        message:
          error?.response?.data?.message || "Failed to resend code. Please try again.",
        color: "red",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleResendPhone = async () => {
    if (!activeEmail && !activePhone) {
      notifications.show({
        message: "Please enter your phone number to resend code.",
        color: "red",
      });
      return;
    }
    setResendingPhone(true);
    try {
      const { data } = await axios.post("/artists/resend-phone-code", {
        email: activeEmail.trim() || undefined,
        phoneNumber: activePhone.trim() || undefined,
      });
      notifications.show({
        title: "Code Sent",
        message:
          data.message ||
          "A new verification code has been sent to your phone via SMS.",
        color: "teal",
      });
      setPhoneCooldown(60);
    } catch (error: any) {
      notifications.show({
        title: "Resend Failed",
        message:
          error?.response?.data?.message || "Failed to resend code. Please try again.",
        color: "red",
      });
    } finally {
      setResendingPhone(false);
    }
  };

  const bothVerified = vData.isEmailVerified && vData.isPhoneVerified;
  const verifiedCount =
    (vData.isEmailVerified ? 1 : 0) + (vData.isPhoneVerified ? 1 : 0);

  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-2xl mx-auto flex flex-col items-center space-y-7 px-4 sm:px-8 py-10 shadow-sm border">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Verify Your Contact Information
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-lg">
          To protect artists and ensure valid accounts on Supported, please
          verify both your email address and phone number with the 6-digit codes sent to you.
        </p>

        {/* Status Tracker */}
        <div className="inline-flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-full text-xs font-medium mt-2">
          <span>Verification Status:</span>
          <span
            className={
              bothVerified
                ? "text-emerald-600 font-bold"
                : "text-amber-600 font-bold"
            }
          >
            {verifiedCount} of 2 completed
          </span>
        </div>
      </div>

      {/* Completion Banner */}
      {bothVerified && (
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Both Email & Phone Verified!</p>
            <p className="text-xs text-emerald-700">
              Your contact details are confirmed. Moving to the next step...
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setActiveStep("awaiting_approval")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
          >
            Continue <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Main Verification Cards */}
      <div className="w-full space-y-5">
        {/* CARD 1: Email Verification */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            vData.isEmailVerified
              ? "bg-emerald-50/40 border-emerald-200"
              : "bg-white border-border shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  vData.isEmailVerified
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Email Verification
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  {activeEmail || "No email specified"}
                </p>
              </div>
            </div>

            {vData.isEmailVerified ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-700 border-amber-300 bg-amber-50 gap-1 text-xs"
              >
                <AlertCircle className="w-3 h-3" /> Pending Code
              </Badge>
            )}
          </div>

          {vData.isEmailVerified ? (
            <div className="pt-3 text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Email address has been successfully verified.</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyEmail} className="pt-4 space-y-3">
              {!activeEmail && (
                <div className="space-y-1">
                  <Label htmlFor="customEmail" className="text-xs">
                    Your Email Address
                  </Label>
                  <Input
                    id="customEmail"
                    type="email"
                    placeholder="Enter your email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailCode" className="text-xs font-medium">
                    6-digit Email Verification Code
                  </Label>
                  <button
                    type="button"
                    onClick={handleResendEmail}
                    disabled={resendingEmail || emailCooldown > 0}
                    className="text-xs text-primary hover:underline font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    {resendingEmail ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {emailCooldown > 0
                      ? `Resend in ${emailCooldown}s`
                      : "Resend Code"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="emailCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 482910"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    className="font-mono tracking-widest text-center text-base"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={verifyingEmail || !emailCode}
                    className="shrink-0"
                  >
                    {verifyingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verify Email"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Check your inbox and spam folder for an email from Supported.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* CARD 2: Phone Number Verification */}
        <div
          className={`border rounded-xl p-5 transition-all ${
            vData.isPhoneVerified
              ? "bg-emerald-50/40 border-emerald-200"
              : "bg-white border-border shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  vData.isPhoneVerified
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-indigo-50 text-indigo-600"
                }`}
              >
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm sm:text-base">
                  Phone Verification (SMS)
                </p>
                <p className="text-xs text-muted-foreground">
                  {activePhone || "No phone specified"}
                </p>
              </div>
            </div>

            {vData.isPhoneVerified ? (
              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 gap-1 text-xs">
                <CheckCircle2 className="w-3 h-3" /> Verified
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-700 border-amber-300 bg-amber-50 gap-1 text-xs"
              >
                <AlertCircle className="w-3 h-3" /> Pending Code
              </Badge>
            )}
          </div>

          {vData.isPhoneVerified ? (
            <div className="pt-3 text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Phone number has been successfully verified.</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyPhone} className="pt-4 space-y-3">
              {!activePhone && (
                <div className="space-y-1">
                  <Label htmlFor="customPhone" className="text-xs">
                    Your Phone Number
                  </Label>
                  <Input
                    id="customPhone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phoneCode" className="text-xs font-medium">
                    6-digit SMS Verification Code
                  </Label>
                  <button
                    type="button"
                    onClick={handleResendPhone}
                    disabled={resendingPhone || phoneCooldown > 0}
                    className="text-xs text-primary hover:underline font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    {resendingPhone ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {phoneCooldown > 0
                      ? `Resend in ${phoneCooldown}s`
                      : "Resend Code"}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="phoneCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 591024"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    className="font-mono tracking-widest text-center text-base"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={verifyingPhone || !phoneCode}
                    className="shrink-0"
                  >
                    {verifyingPhone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verify Phone"
                    )}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Check your phone SMS messages for a code from Supported.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Helpful Guidance */}
      <div className="w-full text-center text-xs text-muted-foreground pt-2 border-t">
        <p>
          Need to change your registration details or having issues receiving
          codes? Contact our support team for immediate assistance.
        </p>
      </div>
    </div>
  );
}
