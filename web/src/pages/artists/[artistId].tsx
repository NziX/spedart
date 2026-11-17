/* eslint-disable @next/next/no-img-element */
import { PaymentModal } from "@/components/artists/shared/PaymentModal";
import EmptyView from "@/components/EmptyView";
import ExploreLayout from "@/components/layouts/ExploreLayout";
import LoadingView from "@/components/LoadingView";
import Song from "@/components/Song";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { generatePageTitle } from "@/lib/utils";
import { useGetArtistById } from "@/services/artists";
import { Heart, Verified } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6";
import { IconType } from "react-icons/lib";

const maxBioLength = 180;


export default function ArtistView() {
	const router = useRouter();
	const { artistId } = router.query;
	const {
		data,
		isLoading: fetchingArtist,
		isError
	} = useGetArtistById(artistId?.toString() ?? "");
	const isExceedingMaxBioLength = useMemo(
		() => (data?.artist?.bio ?? "").length > maxBioLength,
		[data?.artist.bio]
	);

	return (
		<>
			<Head>
				<title>{generatePageTitle("Artist info")}</title>
			</Head>
			<ExploreLayout>
				{
					fetchingArtist ? (
						<LoadingView message="Loading Artist ..." />
					) : isError ? (
						<EmptyView message="Error finding the artist. Please check the if the URL is not broken!" />
					) : !data ? (
						<EmptyView message="No artist found" />
					) :
						<main className="px-4 lg:px-6 grid gap-8 grid-cols-4 py-16 min-h-[75vh]">
							<div className="space-y-4 pr-4 w-full lg:border-r col-span-full lg:col-span-1">
								<div className="flex items-center gap-x-4 pb-6">
									<img
										className="rounded-full border object-cover shrink-0 h-20 w-20"
										src={`${data?.artist.profilePicture}`}
										alt={data?.artist.stageName}
									/>
									<div className="space-y-1">
										<div className="flex items-center gap-x-2">
											<h4 className="font-semibold text-lg">
												{data?.artist?.stageName}
											</h4>
											<Verified
												className="text-primary"
												size={20}
											/>
										</div>
										<p className="text-gray-600">
											{data?.arts.length} songs
										</p>
									</div>
								</div>
								<PaymentModal
									trigger={
										<Button className=" gap-x-2 text-lg px-6 w-full">
											<span>Support</span>
											<Heart size={16} />
										</Button>
									}
									source="support"
									title="Support the artist"
									description="Your support will help the artist create more amazing music."
									artist={data?.artist}
								/>

								{/* about */}
								{data.artist.bio && <div className="pt-4 space-y-2">
									<h4 className="text-xl font-semibold ">About</h4>
									<div>
										<p className="pb-3">
											{(data.artist?.bio ?? "").slice(
												0,
												isExceedingMaxBioLength
													? maxBioLength
													: (data.artist?.bio ?? "").length
											)}
											{isExceedingMaxBioLength && "..."}
										</p>
										{isExceedingMaxBioLength && (
											<AlertDialog>
												<AlertDialogTrigger>
													<Button variant={"outline"}>
														Read more
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															{data.artist.stageName}&apos;s
															Bio
														</AlertDialogTitle>
														<AlertDialogDescription
															className="text-base leading-16
                                            "
														>
															{data.artist.bio}
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															close
														</AlertDialogCancel>
														<AlertDialogAction>
															Support
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
									</div>
								</div>}

								{/* socials */}
								{data.artist.socials && (
									<div className="space-y-3 pt-4">
										{data.artist.socials.twitter && (
											<SocialButton
												label="Twitter"
												Icon={FaXTwitter}
												href={data.artist.socials.twitter}
											/>
										)}
										{data.artist.socials.instagram && (
											<SocialButton
												label="Instagram"
												Icon={FaInstagram}
												href={data.artist.socials.instagram}
											/>
										)}
										{data.artist.socials.facebook && (
											<SocialButton
												label="Facebook"
												Icon={FaFacebook}
												href={data.artist.socials.facebook}
											/>
										)}
									</div>
								)}
							</div>

							{data.arts.length > 0 ?
								<div className="space-y-4 w-full  mt-8 lg:mt-0 col-span-full lg:col-span-3">
									<div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between w-full text-gray-700">
										<p>
											Listen to {data.artist.stageName.split(" ")[0]}&apos;
											upcoming tracks
										</p>
										<p>{data.arts.length} Song{data.arts.length > 1 && 's'}</p>
									</div>
									<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
										{data.arts.map((art, idx) => (
											<Song {...art} key={idx} />
										))}
									</div>
								</div>
								: <EmptyView
									className="col-span-full lg:col-span-3"
									message={`${data.artist.stageName} has no pre-releases available at the moment`}
								/>
							}
						</main>
				}

			</ExploreLayout>
		</>
	);
}

const SocialButton = ({
	Icon,
	href,
	label,
}: {
	Icon: IconType;
	label: string;
	href: string;
}) => {
	return (
		<Link
			href={href}
			className="border-l-2 border-primary flex items-center gap-x-2 bg-gray-100 px-4 py-2 rounded-md hover:bg-primary hover:text-white transition-colors duration-200"
		>
			<Icon />
			<p>{label}</p>
		</Link>
	);
};
