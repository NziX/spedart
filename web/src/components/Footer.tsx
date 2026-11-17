import React from "react";
import Logo from "./Logo";
import { navigation } from "@/lib/constants";
import Link from "next/link";
import { FaFacebook, FaInstagram, FaXTwitter } from "react-icons/fa6";

export default function Footer() {
	return (
		<div className="w-full py-10 px-4 md:px-6">
			<div className="w-full max-w-7xl mx-auto gap-y-7 flex flex-col items-center">
				<div className="flex items-center  justify-between w-full">
					<Logo />
					<div className="hidden md:flex items-center gap-x-4">
						{navigation.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className="hover:text-primary capitalize"
							>
								{item.label}
							</Link>
						))}
					</div>
					<div className="gap-x-3 flex">
						<Link href={"https://x.com"}>
							<FaXTwitter className="hover:text-primary text-2xl  " />
						</Link>
						<Link href={"https://instagram.com"}>
							<FaInstagram className="hover:text-primary text-2xl " />
						</Link>
						<Link href={"https://facebook.com"}>
							<FaFacebook className="hover:text-primary  text-2xl " />
						</Link>
					</div>
				</div>
				<p className="text-gray-600 italic text-sm">
					{new Date().getFullYear()} &copy; Supported. All rights
					reserved
				</p>
			</div>
		</div>
	);
}
