import React, { useState } from "react";
import { useRecoilState } from "recoil";
import { activeOnboardingStepState, verificationState } from "@/atoms";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { UploadButton } from "@/utils/uploadthing";
import { notifications } from "@mantine/notifications";
import axios from "@/lib/axios.config";
import Image from "next/image";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  UploadCloud,
  FileCheck2,
  Trash2,
  Info,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function NationalIdVerification() {
  const [, setActiveStep] = useRecoilState(activeOnboardingStepState);
  const [verificationData] = useRecoilState(verificationState);
  const { artist } = useAuth();

  const [idNumber, setIdNumber] = useState("");
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEmail =
    verificationData.email ||
    artist?.email ||
    (typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pendingVerification") || "{}")?.email || ""
      : "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeEmail) {
      notifications.show({
        title: "Missing Email",
        message: "Could not identify your registered email. Please go back to registration.",
        color: "red",
      });
      return;
    }

    if (!idNumber.trim()) {
      notifications.show({
        title: "ID Number Required",
        message: "Please enter your official National ID or Passport number.",
        color: "red",
      });
      return;
    }

    if (!frontImage) {
      notifications.show({
        title: "Front Scan Required",
        message: "Please upload a clear scan or photo of the FRONT of your National ID.",
        color: "red",
      });
      return;
    }

    if (!backImage) {
      notifications.show({
        title: "Back Scan Required",
        message: "Please upload a clear scan or photo of the BACK of your National ID.",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post("/artists/submit-national-id", {
        email: activeEmail.trim(),
        idNumber: idNumber.trim(),
        frontImage,
        backImage,
      });

      notifications.show({
        title: "ID Documents Saved",
        message:
          data?.message ||
          "Your National ID has been saved. Next, verify your face live to confirm your identity.",
        color: "teal",
      });

      // Advance to live face verification screen
      setActiveStep("live_face_verification");
    } catch (error: any) {
      notifications.show({
        title: "Submission Failed",
        message:
          error?.response?.data?.message ||
          "Could not submit your ID documents. Please try again or contact support.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = Boolean(idNumber.trim() && frontImage && backImage);

  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-2xl mx-auto flex flex-col items-center space-y-6 px-4 sm:px-8 py-10 shadow-sm border">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-1">
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Artist National ID Verification
        </h2>
        <p className="text-sm text-muted-foreground max-w-lg">
          To protect creators and fans from impersonators and scammers, SpedArt verifies
          every artist before account approval. Please provide your official National ID or Passport.
        </p>
      </div>

      {/* Anti-Scam Security Notice */}
      <div className="w-full bg-blue-50/80 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-900 text-xs sm:text-sm">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-950">Safe &amp; Encrypted Identity Verification</p>
          <p className="text-blue-800 leading-relaxed text-xs">
            Make sure your photos are sharp, well-lit, and show all four corners of your card.
            Your legal documents are encrypted and only accessible to SpedArt administrators for
            authenticity verification.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        {/* National ID Number */}
        <div className="space-y-2 bg-white p-4 sm:p-5 rounded-xl border">
          <Label htmlFor="idNumber" className="text-sm font-semibold flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary" />
            National ID or Passport Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="idNumber"
            type="text"
            placeholder="e.g. 1 1999 8 0012345 0 12 or Passport No."
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            className="font-mono tracking-wider text-base h-11"
            required
          />
          <p className="text-[11px] text-muted-foreground">
            Enter the exact number appearing on your government-issued ID card or passport.
          </p>
        </div>

        {/* Upload Cards Grid: Front & Back */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Front of ID */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b mb-3">
                <span className="font-semibold text-sm">1. Front of ID Card</span>
                {frontImage ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                    <CheckCircle2 className="w-3 h-3" /> Uploaded
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-[10px] px-1.5 py-0">
                    Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Photograph or scan the front side showing your full name, photo, and ID number.
              </p>
            </div>

            {frontImage ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={frontImage}
                    alt="National ID Front"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> Front side attached
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFrontImage(null)}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-gray-700 mb-2">Upload Front Side</p>
                <UploadButton
                  endpoint="imageUploader"
                  appearance={{
                    button: "bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary/90",
                  }}
                  onClientUploadComplete={(res) => {
                    if (res && res[0]?.url) {
                      setFrontImage(res[0].url);
                      notifications.show({
                        title: "Front Scan Uploaded",
                        message: "Front of National ID uploaded successfully.",
                        color: "teal",
                      });
                    }
                  }}
                  onUploadError={(error: Error) => {
                    notifications.show({
                      title: "Upload Failed",
                      message: error.message || "Failed to upload ID image.",
                      color: "red",
                    });
                  }}
                />
              </div>
            )}
          </div>

          {/* Back of ID */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-2 border-b mb-3">
                <span className="font-semibold text-sm">2. Back of ID Card</span>
                {backImage ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                    <CheckCircle2 className="w-3 h-3" /> Uploaded
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-[10px] px-1.5 py-0">
                    Required
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Photograph or scan the reverse side showing issue stamps, barcode, or official signatures.
              </p>
            </div>

            {backImage ? (
              <div className="space-y-2">
                <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden border bg-muted">
                  <Image
                    src={backImage}
                    alt="National ID Back"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" /> Back side attached
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setBackImage(null)}
                    className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Change
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-xs font-medium text-gray-700 mb-2">Upload Back Side</p>
                <UploadButton
                  endpoint="imageUploader"
                  appearance={{
                    button: "bg-primary text-white text-xs px-3 py-1.5 rounded-md hover:bg-primary/90",
                  }}
                  onClientUploadComplete={(res) => {
                    if (res && res[0]?.url) {
                      setBackImage(res[0].url);
                      notifications.show({
                        title: "Back Scan Uploaded",
                        message: "Back of National ID uploaded successfully.",
                        color: "teal",
                      });
                    }
                  }}
                  onUploadError={(error: Error) => {
                    notifications.show({
                      title: "Upload Failed",
                      message: error.message || "Failed to upload ID image.",
                      color: "red",
                    });
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            disabled={!isComplete || submitting}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/95 text-white gap-2 shadow-sm transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Saving ID &amp; Continuing...
              </>
            ) : (
              <>
                Save ID &amp; Continue to Live Face Check <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {!isComplete && (
            <p className="text-xs text-center text-amber-700 mt-2 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Please enter your ID number and upload both front and back images to continue.
            </p>
          )}
        </div>
      </form>

      {/* Navigation Footer */}
      <div className="w-full text-center text-xs text-muted-foreground pt-4 border-t flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveStep("verification")}
          className="text-primary hover:underline font-medium"
        >
          &larr; Back to Email Verification
        </button>

        <span className="text-[11px] text-gray-400">
          Account: {activeEmail || "Pending"}
        </span>
      </div>
    </div>
  );
}
