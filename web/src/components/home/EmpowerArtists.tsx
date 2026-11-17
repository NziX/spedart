import Image from "next/image";
import React from "react";
import { AiFillQuestionCircle } from "react-icons/ai";
import { Button } from "../ui/button";
import Link from "next/link";

export default function EmpowerArtists() {
	return (
		<div className="w-full px-4 md:px-6 my-10">
			<div className="w-full mx-auto max-w-7xl flex flex-col gap-x-0 gap-y-12 md:gap-y-0 md:flex-row md:justify-between md:gap-x-10 md:items-center">
				<div className="w-full md:w-1/2 hidden md:block">
					<Image
						src={"/empower-artists.png"}
						alt=""
						width={700}
						height={700}
					/>
				</div>
				<div className="w-full md:w-1/2 space-y-8">
					<div className="flex items-center gap-x-2">
						<AiFillQuestionCircle className="text-xl text-primary" />
						<p>Are You a Music Lover?</p>
					</div>
					<h3 className="font-semibold text-4xl text-primary-text max-w-xl">
						Empower Your Favorite Artists with Your Support
					</h3>
					<p className="max-w-xl pb-10">
						Help the artists you love continue creating great music
						by supporting them directly. Your contributions give
						them the freedom to bring more amazing songs to life and
						connect with their biggest fans—you!
					</p>
					<Link href={"/artists"}>
						<Button>Discover Artists</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
