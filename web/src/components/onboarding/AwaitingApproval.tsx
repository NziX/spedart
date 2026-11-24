import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";

export default function AwaitingApproval() {
  return (
    <div className="bg-[#FEFAFF] rounded-2xl w-full max-w-2xl mx-auto flex flex-col items-center text-center space-y-6 px-6 py-16 shadow-sm border">
      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
        <Clock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Your account is awaiting admin approval
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto text-base">
          Thank you for registering with Supported! We review every artist
          profile to ensure quality and authenticity.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left text-sm text-amber-900 max-w-md w-full space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>Your registration details have been received safely.</span>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            You will receive an email as soon as an administrator reviews and
            approves your account.
          </span>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-3">
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
