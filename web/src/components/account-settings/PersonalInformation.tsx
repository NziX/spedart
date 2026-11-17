import React, { ElementRef, useEffect, useState } from "react";
import { TabsContent } from "../ui/tabs";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { ImageIcon, Loader } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";
import { Button } from "../ui/button";
import useAuth from "@/hooks/useAuth";
import { notifications } from "@mantine/notifications";

export default function PersonalInformation() {
	const { artist, updateProfile, updatingProfile } = useAuth();
	const [pictureUrl, setPictureUrl] = useState<string | null>(null);
	const formRef = React.useRef<ElementRef<"form">>(null);
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const formData = new FormData(e.currentTarget);
		const data = {
			firstName: formData.get("firstName") as string,
			lastName: formData.get("lastName") as string,
			stageName: formData.get("stageName") as string,
			phoneNumber: formData.get("phoneNumber") as string,
			bio: formData.get("bio") as string,
			profilePicture: pictureUrl ?? undefined,
		};

		const hasChanged = Object.keys(data).some((key) => {
			const keyTyped = key as keyof typeof data;
			return data[keyTyped] !== artist?.[keyTyped];
		});

		if (!hasChanged) {
			notifications.show({
				title: "No changes detected",
				message:
					"You have not made any changes to your personal information",
				color: "blue",
			});
			return;
		}

		updateProfile({
			...artist,
			...data,
		});
	};

	useEffect(() => {
		setPictureUrl(artist?.profilePicture ?? null);
	}, [artist]);

	return (
		<TabsContent value="personalInfo" className="w-full">
			<h2 className="pb-4 text-2xl font-semibold">
				Personal Information
			</h2>
			<form
				onSubmit={handleSubmit}
				ref={formRef}
				className="grid grid-cols-1 md:grid-cols-2 gap-6"
			>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 col-span-full ">
					<div className="grid gap-2">
						<Label htmlFor="firstName">First Name</Label>
						<Input
							placeholder="Firt Name"
							name="firstName"
							required
							minLength={2}
							defaultValue={artist?.firstName}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							placeholder="Last Name"
							name="lastName"
							required
							minLength={2}
							defaultValue={artist?.lastName}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="stageName">Stage Name</Label>
						<Input
							placeholder="Stage Name"
							name="stageName"
							required
							minLength={2}
							defaultValue={artist?.stageName}
						/>
					</div>
				</div>

				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						name="email"
						type="email"
						placeholder="email"
						required
						disabled
						defaultValue={artist?.email}
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="phoneNumber">Phone Number</Label>
					<Input
						name="phoneNumber"
						type="tel"
						required
						minLength={9}
						defaultValue={artist?.phoneNumber}
					/>
				</div>
				<div className="grid gap-2 col-span-full">
					<Label htmlFor="Bio">Bio</Label>
					<Textarea
						placeholder="your Bio"
						rows={5}
						name="bio"
						defaultValue={artist?.bio}
					/>
				</div>
				<div className="grid gap-2 col-span-full">
					<Label htmlFor="Bio">Profile Picture</Label>
					<div className="flex flex-col sm:flex-row items-center gap-x-4">
						<div className="p-2 rounded-md bg-gray-100 shrink-0">
							{pictureUrl ? (
								<Image
									src={pictureUrl}
									alt="profile picture"
									width={100}
									height={100}
								/>
							) : (
								<ImageIcon className="w-24 h-24 text-primary/75" />
							)}
						</div>
						<div>
							<p className="text-sm pb-1">Select new image</p>
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

				<div className="col-span-full flex items-center pt-5 border-t gap-x-3">
					<Button
						type="button"
						onClick={() => formRef.current?.reset()}
						variant={"outline"}
						className="px-8 w-full sm:w-44"
					>
						Reset
					</Button>
					<Button
						disabled={updatingProfile}
						type="submit"
						className="px-8 w-full sm:w-44"
					>
						{updatingProfile ? <Loader /> : "Save"}
					</Button>
				</div>
			</form>
		</TabsContent>
	);
}
