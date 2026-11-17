import { activeOnboardingStepState, onboardingDataState } from "@/atoms";
import { Image as ImageIcon, Loader } from "lucide-react";
import React from "react";
import { useRecoilState } from "recoil";
import ProgressIndicator from "../ProgressIndicator";
import { Button } from "../ui/button";

import useAuth from "@/hooks/useAuth";
import { UploadButton } from "@/utils/uploadthing";
import { notifications } from "@mantine/notifications";
import Image from "next/image";

export default function ArtistProfile() {
	const [, setActiveStep] = useRecoilState(activeOnboardingStepState);
	const [pictureUrl, setPictureUrl] = React.useState<string | null>(null);
	const [onboardingData, setOnboardingData] =
		useRecoilState(onboardingDataState);
	const { completeProfile, completingProfile, artist } = useAuth();

	const handleCompleteProfile = () => {
		if (!pictureUrl) {
			notifications.show({
				title: "Profile picture is required",
				message: "Please upload a profile picture",
				color: "red",
			});
			return;
		}
		completeProfile({ journey: onboardingData.journey ?? "", profilePicture: pictureUrl });
	};

	return (
		<div className="bg-primary-background rounded-2xl py-16  w-full space-y-10 min-h-[27rem]">
			<div className="max-w-5xl mx-auto px-4 space-y-8">
				<div className="space-y-5">
					<h4 className="text-3xl font-semibold text-primary-text">
						Complete Your Artist Profile
					</h4>
					<p className="max-w-2xl">
						Almost there! To finish setting up your profile. These
						final touches will help fans get to know you better and
						make your profile truly shine.
					</p>
				</div>
				<div className="w-full flex items-center justify-between">
					<div className="flex gap-x-3">
						<div className="p-3 rounded-md bg-gray-100 shrink-0">
							{pictureUrl ? (
								<Image
									src={pictureUrl}
									alt="profile picture"
									width={100}
									height={100}
								/>
							) : (
								<ImageIcon className="w-20 h-20" />
							)}
						</div>
						<div className="space-y-2">
							<p>
								{artist?.firstName} {artist?.lastName}
							</p>
							<UploadButton
								endpoint="imageUploader"
								onClientUploadComplete={(res) => {
									setPictureUrl(res[0].url);
								}}
								onUploadError={(error: Error) => {
									alert(`ERROR! ${error.message}`);
								}}
							/>
						</div>
					</div>
				</div>
			</div>
			<div className="w-full space-y-4 md:px-6 lg:px-10">
				<ProgressIndicator percentage={100 * (2 / 3)} />
				<div className="flex justify-between items-center">
					<Button
						disabled={completingProfile}
						variant={"secondary"}
						onClick={() => setActiveStep("artist_journey")}
					>
						Previous
					</Button>
					<Button
						disabled={completingProfile}
						onClick={() => handleCompleteProfile()}
					>
						{completingProfile ? (
							<Loader color="white" />
						) : (
							"Complete profile"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
