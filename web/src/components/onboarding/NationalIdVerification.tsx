import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRecoilState } from "recoil";
import { activeOnboardingStepState, verificationState } from "@/atoms";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { UploadButton, uploadFiles } from "@/utils/uploadthing";
import { notifications } from "@mantine/notifications";
import axios from "@/lib/axios.config";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
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
  Camera,
  RefreshCw,
  VideoOff,
  AlertTriangle,
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
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Live ID camera scanner state
  const [scanningSide, setScanningSide] = useState<"front" | "back" | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeEmail =
    verificationData.email ||
    artist?.email ||
    (typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pendingVerification") || "{}")?.email || ""
      : "");

  // Safe ref callback for video element
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
      element.play().catch((err) => console.log("ID camera playback", err));
    }
  }, []);

  // Start ID scanner camera (prefers back environment camera for documents on mobile)
  const startIdCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.log(err));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("ID Camera error:", err);
      let msg = "Could not access camera. Please allow camera permissions to scan your ID.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Camera permission denied. Please allow camera access in your browser to scan your document.";
      }
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  const stopIdCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (scanningSide) {
      startIdCamera();
    } else {
      stopIdCamera();
    }
    return () => {
      stopIdCamera();
    };
  }, [scanningSide, startIdCamera, stopIdCamera]);

  // Client-side verification function for ID images
  const validateIdImage = async (
    fileUrl: string,
    isFront: boolean
  ): Promise<{ valid: boolean; reason?: string }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
        // Basic sanity check: reject corrupt or extremely tiny files (< 150px)
        if (img.naturalWidth < 150 || img.naturalHeight < 100) {
          return resolve({
            valid: false,
            reason: "Image resolution is too low. Please upload a clear photo of your ID card.",
          });
        }

        resolve({ valid: true });
      };

      img.onerror = () => {
        resolve({
          valid: false,
          reason: "Could not process image. Please upload a standard JPEG or PNG photo.",
        });
      };

      img.src = fileUrl;
    });
  };

  // Capture frame from ID camera scanner
  const captureIdFromCamera = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      notifications.show({
        title: "Camera Not Ready",
        message: "Please wait for the live camera view to load.",
        color: "yellow",
      });
      return;
    }

    setCapturing(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas context.");

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob((b) => res(b), "image/jpeg", 0.92)
      );

      if (!blob) throw new Error("Failed to capture image from camera.");

      const file = new File(
        [blob],
        `id-${scanningSide}-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      const uploaded = await uploadFiles("imageUploader", {
        files: [file],
      });

      if (!uploaded || !uploaded[0]?.url) {
        throw new Error("Failed to upload captured ID photo.");
      }

      const photoUrl = uploaded[0].url;

      if (scanningSide === "front") {
        setFrontImage(photoUrl);
        notifications.show({
          title: "Front ID Captured",
          message: "Front of National ID captured successfully.",
          color: "teal",
        });
      } else {
        if (photoUrl === frontImage) {
          notifications.show({
            title: "Duplicate Image",
            message: "The back of your ID cannot be identical to the front.",
            color: "red",
          });
          return;
        }
        setBackImage(photoUrl);
        notifications.show({
          title: "Back ID Captured",
          message: "Back of National ID captured successfully.",
          color: "teal",
        });
      }

      setScanningSide(null);
    } catch (err: any) {
      console.error("Capture ID error:", err);
      notifications.show({
        title: "Capture Failed",
        message: err?.message || "Failed to capture and upload ID scan.",
        color: "red",
      });
    } finally {
      setCapturing(false);
    }
  };

  const handleUploadedFile = async (url: string, isFront: boolean) => {
    // Duplicate check
    if (!isFront && url === frontImage) {
      notifications.show({
        title: "Duplicate Document",
        message: "The back of your National ID cannot be the same file as the front.",
        color: "red",
      });
      setBackImage(null);
      return;
    }

    const check = await validateIdImage(url, isFront);
    if (!check.valid) {
      notifications.show({
        title: "Invalid ID Photo",
        message: check.reason || "The uploaded image does not meet National ID requirements.",
        color: "red",
      });
      if (isFront) setFrontImage(null);
      else setBackImage(null);
      return;
    }

    if (isFront) {
      setFrontImage(url);
      notifications.show({
        title: "Front ID Validated",
        message: "Front of National ID uploaded and validated successfully.",
        color: "teal",
      });
    } else {
      setBackImage(url);
      notifications.show({
        title: "Back ID Validated",
        message: "Back of National ID uploaded and validated successfully.",
        color: "teal",
      });
    }
  };

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
        message: "Please scan or upload the FRONT of your National ID.",
        color: "red",
      });
      return;
    }

    if (!backImage) {
      notifications.show({
        title: "Back Scan Required",
        message: "Please scan or upload the BACK of your National ID.",
        color: "red",
      });
      return;
    }

    if (frontImage === backImage) {
      notifications.show({
        title: "Duplicate Documents",
        message: "The front and back of your National ID must be two different photos.",
        color: "red",
      });
      return;
    }

    setVerificationError(null);
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
      const errMsg =
        error?.response?.data?.message ||
        "Could not verify your ID documents. Please upload a clear photo of an authentic government ID or passport.";
      setVerificationError(errMsg);
      notifications.show({
        title: "ID Document Verification Failed",
        message: errMsg,
        color: "red",
        autoClose: 8000,
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
          <p className="font-semibold text-blue-950">Official Document Verification Only</p>
          <p className="text-blue-800 leading-relaxed text-xs">
            You must provide photos of a genuine government-issued ID card or Passport.
            Uploading non-ID photos (such as random images, memes, or screenshots) will be rejected
            by our automated verification system and administrators.
          </p>
        </div>
      </div>

      {verificationError && (
        <div className="w-full bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3 text-red-950 text-xs sm:text-sm">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-red-900">ID Verification Rejected</p>
            <p className="text-red-800 leading-relaxed text-xs">{verificationError}</p>
          </div>
        </div>
      )}

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
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 space-y-3">
                {/* Option 1: Live Camera Scan */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScanningSide("front")}
                  className="w-full text-xs font-medium gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                >
                  <Camera className="w-3.5 h-3.5" /> Scan Front with Camera
                </Button>

                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Or upload file</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Option 2: Upload File with Validation */}
                <UploadButton
                  endpoint="imageUploader"
                  appearance={{
                    button: "bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md hover:bg-gray-900 w-full",
                  }}
                  onClientUploadComplete={async (res) => {
                    if (res && res[0]?.url) {
                      await handleUploadedFile(res[0].url, true);
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
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 space-y-3">
                {/* Option 1: Live Camera Scan */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScanningSide("back")}
                  className="w-full text-xs font-medium gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
                >
                  <Camera className="w-3.5 h-3.5" /> Scan Back with Camera
                </Button>

                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] uppercase text-muted-foreground font-semibold">Or upload file</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Option 2: Upload File with Validation */}
                <UploadButton
                  endpoint="imageUploader"
                  appearance={{
                    button: "bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md hover:bg-gray-900 w-full",
                  }}
                  onClientUploadComplete={async (res) => {
                    if (res && res[0]?.url) {
                      await handleUploadedFile(res[0].url, false);
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
                <Loader2 className="w-5 h-5 animate-spin" /> Verifying ID Authenticity...
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

      {/* Live ID Camera Scanner Modal Dialog */}
      <Dialog open={scanningSide !== null} onOpenChange={(open) => !open && setScanningSide(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Camera className="w-5 h-5 text-indigo-600" />
              Scan {scanningSide === "front" ? "Front" : "Back"} of National ID
            </DialogTitle>
            <DialogDescription>
              Align your physical ID card inside the frame and make sure it is sharp and readable.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-4 py-2">
            <div className="relative w-full aspect-[3/2] rounded-xl overflow-hidden border-2 border-primary/30 bg-black flex items-center justify-center shadow-inner">
              <video
                ref={setVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />

              {cameraActive ? (
                <>
                  {/* ID Card Rectangular Outline Guide */}
                  <div className="absolute inset-4 pointer-events-none border-2 border-dashed border-white/90 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                    <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-xs">
                      Fit ID Card in Box
                    </span>
                  </div>

                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live View
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-white flex flex-col items-center space-y-2">
                  <VideoOff className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-gray-300">
                    {cameraError || "Initializing camera..."}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={startIdCamera}
                    className="bg-primary hover:bg-primary/90 text-white text-xs gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Retry Camera
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={captureIdFromCamera}
              disabled={!cameraActive || capturing}
              className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold gap-1.5 shadow-sm"
            >
              {capturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Capturing &amp; Processing...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" /> Capture {scanningSide === "front" ? "Front" : "Back"} Photo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
