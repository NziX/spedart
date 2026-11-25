import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRecoilState } from "recoil";
import { activeOnboardingStepState, verificationState } from "@/atoms";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { notifications } from "@mantine/notifications";
import { uploadFiles } from "@/utils/uploadthing";
import axios from "@/lib/axios.config";
import Image from "next/image";
import {
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Video,
  VideoOff,
  UserCheck,
  Sparkles,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";

export default function LiveFaceVerification() {
  const [, setActiveStep] = useRecoilState(activeOnboardingStepState);
  const [verificationData] = useRecoilState(verificationState);
  const { artist } = useAuth();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeEmail =
    verificationData.email ||
    artist?.email ||
    (typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("pendingVerification") || "{}")?.email || ""
      : "");

  // Attach video stream to ref callback so it is never null on mount
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && streamRef.current) {
      element.srcObject = streamRef.current;
      element.play().catch((err) => console.log("Video playback ready", err));
    }
  }, []);

  // Start device live camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.error("Video play error:", err));
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Could not access camera. Please allow camera permissions in your browser to verify your identity.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Camera access denied. Please click the camera icon in your browser address bar to allow camera access and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "No camera found on this device. Please use a device equipped with a front camera or webcam.";
      }
      setCameraError(message);
      setCameraActive(false);
    }
  }, []);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!capturedPhotoUrl) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [capturedPhotoUrl, startCamera, stopCamera]);

  // Capture still photo from live video feed
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      notifications.show({
        title: "Camera Not Ready",
        message: "Please wait a moment for the live camera stream to initialize.",
        color: "yellow",
      });
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Mirror horizontal flip so captured image matches natural face view
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const photoUrl = URL.createObjectURL(blob);
        setCapturedBlob(blob);
        setCapturedPhotoUrl(photoUrl);
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  // Retake photo: clear snapshot and reopen live stream
  const retakePhoto = () => {
    setCapturedPhotoUrl(null);
    setCapturedBlob(null);
    startCamera();
  };

  // Upload captured selfie and save to backend
  const handleConfirmAndContinue = async () => {
    if (!capturedBlob) {
      notifications.show({
        title: "Photo Required",
        message: "Please take a live selfie using your camera before continuing.",
        color: "red",
      });
      return;
    }

    if (!activeEmail) {
      notifications.show({
        title: "Missing Email",
        message: "Could not identify your registered email. Please go back to registration.",
        color: "red",
      });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Convert captured blob to a File object for UploadThing
      const file = new File(
        [capturedBlob],
        `live-face-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      // 2. Upload to UploadThing imageUploader
      const uploaded = await uploadFiles("imageUploader", {
        files: [file],
      });

      if (!uploaded || !uploaded[0]?.url) {
        throw new Error("Failed to upload live face verification image.");
      }

      const livePhotoUrl = uploaded[0].url;

      // 3. Save to backend artist profile
      const { data } = await axios.post("/artists/submit-live-face", {
        email: activeEmail.trim(),
        liveFacePhoto: livePhotoUrl,
      });

      notifications.show({
        title: "Live Face Verified!",
        message:
          data?.message ||
          "Your live face verification has been captured. Next, tell fans about your artist journey.",
        color: "teal",
      });

      // 4. Advance to Artist Journey step
      setActiveStep("artist_journey");
    } catch (error: any) {
      console.error("Live face submission error:", error);
      notifications.show({
        title: "Submission Error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Could not save live face verification. Please try again.",
        color: "red",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-xl mx-auto flex flex-col items-center space-y-6 px-4 sm:px-8 py-10 shadow-sm border">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-1">
          <Camera className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Live Face Verification
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          To confirm you are the true owner of the National ID and prevent scam accounts,
          please take a live selfie with your camera. No uploaded photos are permitted.
        </p>
      </div>

      {/* Security Info Card */}
      <div className="w-full bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-emerald-950 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-900">Live Camera Verification</p>
          <p className="text-emerald-800 leading-relaxed text-[11px] mt-0.5">
            Look directly at your camera with neutral expression. Make sure your face is well-lit
            and fully visible inside the oval frame without sunglasses or face coverings.
          </p>
        </div>
      </div>

      {/* Camera / Captured Viewfinder Box */}
      <div className="w-full flex flex-col items-center">
        <div className="relative w-full max-w-xs aspect-[3/4] sm:aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 bg-black flex items-center justify-center shadow-inner">
          {/* Always mounted video element so ref is never null */}
          <video
            ref={setVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] ${
              cameraActive && !capturedPhotoUrl ? "block" : "hidden"
            }`}
          />

          {capturedPhotoUrl ? (
            /* Still Snapshot Preview */
            <div className="relative w-full h-full">
              <Image
                src={capturedPhotoUrl}
                alt="Captured Live Face"
                fill
                className="object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge className="bg-emerald-600 text-white gap-1 text-[11px] shadow-sm">
                  <CheckCircle2 className="w-3 h-3" /> Live Capture
                </Badge>
              </div>
            </div>
          ) : cameraActive ? (
            /* Oval Guideline Overlay */
            <>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-72 sm:w-60 sm:h-72 rounded-[50%] border-2 border-dashed border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] flex items-center justify-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-white/90 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    Position Face Here
                  </div>
                </div>
              </div>

              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Camera
              </div>
            </>
          ) : (
            /* Camera Off / Permission Error View */
            <div className="p-6 text-center text-white flex flex-col items-center space-y-3">
              <VideoOff className="w-10 h-10 text-muted-foreground" />
              <p className="text-xs text-gray-300">
                {cameraError || "Camera is not active."}
              </p>
              <Button
                type="button"
                size="sm"
                onClick={startCamera}
                className="bg-primary hover:bg-primary/90 text-white text-xs gap-1.5"
              >
                <Video className="w-3.5 h-3.5" /> Start Camera
              </Button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-xs mt-5 space-y-2">
          {capturedPhotoUrl ? (
            <div className="space-y-2">
              <Button
                type="button"
                onClick={handleConfirmAndContinue}
                disabled={submitting}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold gap-1.5 shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying &amp; Saving...
                  </>
                ) : (
                  <>
                    Confirm &amp; Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={retakePhoto}
                disabled={submitting}
                className="w-full h-9 text-xs gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Retake Live Selfie
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={!cameraActive}
              className="w-full h-12 bg-primary hover:bg-primary/95 text-white font-semibold text-base gap-2 shadow-sm transition-all"
            >
              <Camera className="w-5 h-5" /> Take Live Photo
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="w-full text-center text-xs text-muted-foreground pt-4 border-t flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            stopCamera();
            setActiveStep("national_id");
          }}
          className="text-primary hover:underline font-medium"
        >
          &larr; Back to ID Scan
        </button>

        <span className="text-[11px] text-gray-400">
          Account: {activeEmail || "Pending"}
        </span>
      </div>
    </div>
  );
}
