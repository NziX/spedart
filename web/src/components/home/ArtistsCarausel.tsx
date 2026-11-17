import { Card } from "@/components/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { artists } from "@/lib/constants";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

export function ArtistsCarousel() {
	return (
		<div className="w-full flex flex-col items-center space-y-8 my-20 px-6">
			<h2 className="text-3xl text-primary-text font-semibold">
				Support and Explore 100+ Artists You Love
			</h2>
			<Carousel
				opts={{
					align: "start",
				}}
				className="w-full"
			>
				<CarouselContent>
					{artists.map((artist, index) => (
						<CarouselItem
							key={index}
							className="md:basis-1/3 lg:basis-1/4"
						>
							<div className="p-1 rounded-xl">
								<Card className="relative rounded-xl w-full h-[400px] md:h-[300px]">
									<Image
										src={artist.profilePicture}
										alt={artist.name}
										fill
										className="w-full object-cover h-full rounded-xl"
									/>
									<div className="absolute bottom-4 left-4 rounded-full text-sm bg-black/50 text-white px-4 py-2 font-semibold">
										{artist.name}
									</div>
								</Card>
							</div>
						</CarouselItem>
					))}
				</CarouselContent>
				<div className="flex items-center justify-center space-x-12 mt-4">
					<CarouselPrevious />
					<CarouselNext />
				</div>
			</Carousel>
			<Link href={"/artists"} className="mt-10">
				<Button variant={"outline"} className="border-primary">
					Explore All artists
				</Button>
			</Link>
		</div>
	);
}
