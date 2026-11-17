import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import useArtistArts from "@/hooks/useArtistArts";
import { cn } from "@/lib/utils";
import { Art, EArtType, ECurrency } from "@/types";
import { UploadButton } from "@/utils/uploadthing";
import { notifications } from "@mantine/notifications";
import { format } from "date-fns";
import { CalendarIcon, Loader } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FiShare } from "react-icons/fi";
import { useRecoilState } from "recoil";
import { showShareSongModalState } from "@/atoms";

interface Props {
	song?: Art;
	action: "add" | "edit";
}

export default function AddOrEditPreRelease({ song, action }: Props) {
	const [, setShowShareModal] = useRecoilState(showShareSongModalState);
	const { createArt, creatingArt, updatingArt, updateArt } = useArtistArts();
	const [uploadedSong, setUploadedSong] = useState<{
		key: string;
		name: string;
		size: number;
		url: string;
	} | null>(null);

	const [thumbnailUrl, setThumbnailUrl] = React.useState<string | null>(null);
	const [releaseDate, setReleaseDate] = React.useState<Date>();

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			type: EArtType.SONG,
			title: formData.get("title") as string,
			description: formData.get("description") as string,
			pricing: {
				paid: true,
				price: Number(formData.get("price")),
				currency: ECurrency.RWF,
			},
			thumbnail: thumbnailUrl || undefined,
			song: uploadedSong || undefined,
			releaseDate: releaseDate?.toISOString(),
		};
		if (!uploadedSong) {
			notifications.show({
				title: "No song uploaded",
				message: "Please upload a song to continue",
				color: "red",
			});
			return;
		}
		if (!thumbnailUrl) {
			notifications.show({
				title: "No thumbnail uploaded",
				message: "Please upload a thumbnail to continue",
				color: "red",
			});
			return;
		}
		if (!releaseDate) {
			notifications.show({
				title: "No release date selected",
				message: "Please select a release date to continue",
				color: "red",
			});
			return;
		}
		if (action === "add") {
			createArt(data);
		} else {
			const hasChanged =
				data.title !== song!.title ||
				data.description !== song!.description ||
				data.thumbnail !== song!.thumbnail ||
				data.releaseDate !== song!.releaseDate ||
				data.pricing.price !== song!.pricing.price;
			if (!hasChanged) {
				notifications.show({
					title: "No changes",
					message: "You have not made any changes",
					color: "blue",
				});
				return;
			}
			updateArt({
				...song!,
				...data,
				// @ts-ignore
				artist: song!.artist._id,
			});
		}
	};

	useEffect(() => {
		if (song) {
			setThumbnailUrl(song.thumbnail);
			setReleaseDate(new Date(song.releaseDate));
			setUploadedSong({
				name: song.title,
				...song.song,
			});
		}
	}, [song]);

	return (
		<main className="w-full px-4 md:px-6">
			<Card className="w-full py-4 min-h-[40rem] mt-6 px-4">
				<div className="w-full flex justify-between">
					<div className="pb-6">
						<Link
							href="/dashboard/pre-releases"
							className="text-sm font-semibold text-gray-700 hover:text-primary"
						>
							&larr; Go to pre-releases
						</Link>
						<h2 className="text-2xl font-semibold">
							{action === "add" ? "New Pre-release" : "Pre-release Details"}
						</h2>
						<p className="text-gray-600">
							{action === "add"
								? "Create a new pre-release"
								: "Edit the pre-release details"}
						</p>
					</div>
					{action === "edit" && (
						<Button
							onClick={() =>
								setShowShareModal({
									show: true,
									song: song!,
								})
							}
							className="flex items-center gap-x-2"
						>
							<FiShare />
							<span> share song</span>
						</Button>
					)}
				</div>
				<form
					onSubmit={handleSubmit}
					className="grid grid-cols-1 md:grid-cols-2 gap-6"
				>
					<div className="grid gap-4 h-fit">
						<Label>Song Thumbnail</Label>
						<div className="flex flex-col lg:flex-row items-center justify-center w-full h-auto sm:h-96 bg-gray-50 rounded-md border-2 border-dashed gap-4 sm:gap-6 p-4">
							<div className="relative h-48 sm:h-full w-full lg:w-1/2">
								{thumbnailUrl ? (
									<Image
										src={thumbnailUrl}
										alt="thumbnail"
										layout="fill"
										objectFit="contain"
										className="h-full w-full"
									/>
								) : (
									<Image
										src="/placeholder.png"
										alt="thumbnail"
										layout="fill"
										objectFit="contain"
										className="h-full w-full"
									/>
								)}
							</div>
							<div className="w-full lg:w-1/2 flex justify-center">
								<UploadButton
									endpoint="imageUploader"
									onClientUploadComplete={(res) => {
										setThumbnailUrl(res[0].url);
									}}
									onUploadError={(error: Error) => {
										alert(`ERROR! ${error.message}`);
									}}
								/>
							</div>
						</div>
					</div>
					<div className="space-y-4">
						<div className="grid gap-2">
							<Label htmlFor="title">Title</Label>
							<Input
								name="title"
								type="text"
								placeholder="Title"
								defaultValue={song?.title}
								required
							/>
						</div>
						<div className="grid gap-2 ">
							<Label htmlFor="description">Description</Label>
							<Textarea
								name="description"
								placeholder="Description (optional)"
								defaultValue={song?.description}
							/>
						</div>
						<div className="grid gap-2">
							<Label>Release Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant={"outline"}
										className={cn(
											"w-full md:w-[280px] justify-start text-left font-normal",
											!releaseDate && "text-muted-foreground",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{releaseDate ? (
											format(releaseDate, "PPP")
										) : (
											<span>Release Date</span>
										)}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0">
									<Calendar
										mode="single"
										selected={releaseDate}
										onSelect={setReleaseDate}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
						<div className="flex flex-col items-start gap-y-4 w-full border-gray-300 py-4 border-t border-dashed border-b">
							<Label>Upload song</Label>
							{uploadedSong && (
								<div className="">
									<p className="px-2 py-1 rounded-md border-2  border-dashed">
										{uploadedSong.name}
									</p>
								</div>
							)}
							{uploadedSong && action !== "edit" && (
								<Label>Choose a different one</Label>
							)}
							{action !== "edit" && (
								<UploadButton
									endpoint="audioUploader"
									onClientUploadComplete={(res) => {
										setUploadedSong(res[0]);
									}}
								/>
							)}
						</div>
						<div className="grid gap-2">
							<Label htmlFor="price">Price (in RWF)</Label>
							<Input
								type="number"
								name="price"
								placeholder="Price"
								defaultValue={song?.pricing.price}
								required
							/>
						</div>
					</div>
					<div className="col-span-full flex gap-x-5 items-center pt-4 mt-6 border-t">
						<Button
							disabled={creatingArt || updatingArt}
							type="submit"
							className="px-8 min-w-44"
						>
							{creatingArt || updatingArt ? (
								<Loader className="text-white animate-spin" />
							) : action === "add" ? (
								"Publish"
							) : (
								"Update Details"
							)}
						</Button>
					</div>
				</form>
			</Card>
		</main>
	);
}
