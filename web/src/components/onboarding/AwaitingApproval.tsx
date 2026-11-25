import Link from "next/link";
import { Clock, CheckCircle2, ShieldCheck, UserCheck, Camera } from "lucide-react";
import { Button } from "../ui/button";

export default function AwaitingApproval() {
  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-2xl mx-auto flex flex-col items-center text-center space-y-6 px-6 py-14 shadow-sm border">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
        <Clock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Application Complete &amp; Awaiting Approval
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
          All your required information and verification documents have been safely received!
          SpedArt administrators will review your profile to activate your account.
        </p>
      </div>

      {/* Submitted Requirements Checklist */}
      <div className="bg-white border rounded-xl p-5 text-left text-sm max-w-lg w-full space-y-3 shadow-xs">
        <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
          Submitted Requirements
        </p>

        <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Basic artist registration details submitted</span>
        </div>

        <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Email address verified with code</span>
        </div>

        <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>National ID documents (Front &amp; Back scans) submitted</span>
        </div>

        <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Live face verification selfie confirmed</span>
        </div>

        <div className="flex items-center gap-2.5 text-emerald-800 text-xs sm:text-sm">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Artist story/journey &amp; profile picture uploaded</span>
        </div>

        <hr className="my-2 border-dashed" />

        <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Final Step: SpedArt administrator review &amp; account approval</span>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <Link href="/login">
          <Button variant="outline" className="w-full sm:w-auto">
            Go to Login
          </Button>
        </Link>
        <Link href="/">
          <Button className="w-full sm:w-auto">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
