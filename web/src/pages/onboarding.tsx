import { activeOnboardingStepState } from "@/atoms";
import Logo from "@/components/Logo";
import ArtistProfile from "@/components/onboarding/ArtistProfile";
import ArtistJourney from "@/components/onboarding/Journey";
import Registration from "@/components/onboarding/Registration";
import Verification from "@/components/onboarding/Verification";
import NationalIdVerification from "@/components/onboarding/NationalIdVerification";
import AwaitingApproval from "@/components/onboarding/AwaitingApproval";
import { generatePageTitle } from "@/lib/utils";
import Head from "next/head";
import Link from "next/link";
import { useRecoilValue } from "recoil";

export default function Onboarding() {
  const activeStep = useRecoilValue(activeOnboardingStepState);

  return (
    <>
      <Head>
        <title>{generatePageTitle("Create artist profile")}</title>
      </Head>
      <div className="min-h-screen">
        <div className="mx-auto px-4 md:px-6 max-w-7xl w-full py-10">
          <Header />
          {activeStep === "registration" && <Registration />}
          {activeStep === "verification" && <Verification />}
          {activeStep === "national_id" && <NationalIdVerification />}
          {activeStep === "artist_journey" && <ArtistJourney />}
          {activeStep === "profile" && <ArtistProfile />}
          {activeStep === "awaiting_approval" && <AwaitingApproval />}
        </div>
      </div>
    </>
  );
}

const Header = () => {
  return (
    <div className="w-full flex items-center justify-between mb-10">
      <Logo link />
      <Link href={"/contact"}>Contact us</Link>
    </div>
  );
};
