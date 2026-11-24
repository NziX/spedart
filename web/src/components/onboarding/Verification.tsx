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
  const [customEmail, setCustomEmail] = useState("");
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  // Restore from localStorage if recoil atom is empty on page refresh
  useEffect(() => {
    if (!vData.email && typeof window !== "undefined") {
      const stored = localStorage.getItem("pendingVerification");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setVData(parsed);
          if (parsed.email) setCustomEmail(parsed.email);
        } catch (e) {
          console.error("Error reading stored verification:", e);
        }
      }
    } else {
      if (vData.email) setCustomEmail(vData.email);
    }
  }, [vData.email, setVData]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCooldown > 0) {
      timer = setInterval(() => {
        setEmailCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCooldown]);

  const activeEmail = vData.email || customEmail;

  // Auto transition when email is verified
  useEffect(() => {
    if (vData.isEmailVerified) {
      const timeout = setTimeout(() => {
        setActiveStep("awaiting_approval");
      }, 1600);
      return () => clearTimeout(timeout);
    }
  }, [vData.isEmailVerified, setActiveStep]);

  const updateStoredVerification = (updated: Partial<typeof vData>) => {
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
        message:
          data.message || "Your email address has been successfully verified!",
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
        message:
          data.message || "A new verification code has been sent to your email.",
        color: "teal",
      });
      setEmailCooldown(60);
    } catch (error: any) {
      notifications.show({
        title: "Resend Failed",
        message:
          error?.response?.data?.message ||
          "Failed to resend code. Please try again.",
        color: "red",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-xl mx-auto flex flex-col items-center space-y-6 px-4 sm:px-8 py-10 shadow-sm border">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-1">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Verify Your Email Address
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          To ensure account authenticity and protect artists on Supported,
          please enter the 6-digit code sent to your email.
        </p>
      </div>

      {/* Completion Banner */}
      {vData.isEmailVerified && (
        <div className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900 animate-fadeIn">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Email Verified!</p>
            <p className="text-xs text-emerald-700">
              Your email is confirmed. Moving to the next step...
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

      {/* Verification Card */}
      <div
        className={`w-full border rounded-xl p-5 sm:p-6 transition-all ${
          vData.isEmailVerified
            ? "bg-emerald-50/40 border-emerald-200"
            : "bg-white border-border shadow-sm"
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                vData.isEmailVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm sm:text-base">
                Email Address
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
          <div className="pt-4 text-xs sm:text-sm text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Email address has been successfully verified.</span>
          </div>
        ) : (
          <form onSubmit={handleVerifyEmail} className="pt-4 space-y-4">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailCode" className="text-xs font-medium">
                  6-digit Verification Code
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
                  className="font-mono tracking-widest text-center text-lg h-11"
                  required
                />
                <Button
                  type="submit"
                  disabled={verifyingEmail || !emailCode}
                  className="shrink-0 h-11 px-5"
                >
                  {verifyingEmail ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify Email"
                  )}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground pt-1">
                Please check your inbox (and spam/junk folder) for the verification code from Supported.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="w-full text-center text-xs text-muted-foreground pt-2 border-t">
        <p>
          Need to change your email or having issues?{" "}
          <button
            type="button"
            onClick={() => setActiveStep("registration")}
            className="text-primary hover:underline font-medium"
          >
            Go back to registration
          </button>
        </p>
      </div>
    </div>
  );
}
