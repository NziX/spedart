import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { BiMusic } from "react-icons/bi";

export default function Hero() {
	return (
		<div className="w-full px-4 md:px-6  py-12 lg:py-24">
			<div className="w-full mx-auto max-w-7xl flex flex-col gap-x-0 gap-y-12 md:gap-y-0 md:flex-row md:gap-x-12 md:items-center">
				<div className="space-y-12 md:w-1/2">
					<h3 className="text-primary-text text-5xl font-bold">
						Join the Movement and Empower the Music
					</h3>
					<p className="text-primary-text">
						Artists, share your work with the world, and fans, help
						your favorite artists grow and succeed. Supported
						connects you both, giving artists the tools to grow and
						fans the opportunity to make a real impact.
					</p>
					<div className="flex items-center gap-x-6">
						<Link href={"/artists"}>
							<Button>Browse artists</Button>
						</Link>
						<Link href={"/onboarding"}>
							<Button variant={"outline"}>
								<BiMusic />
								<p className="pl-2">Get started as an artist</p>
							</Button>
						</Link>
					</div>
				</div>
				<div className="md:w-1/2">
					<Image src={"/hero.png"} alt="" width={700} height={700} />
				</div>
			</div>
		</div>
	);
}
