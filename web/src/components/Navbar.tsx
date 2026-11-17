import React from "react";
import Logo from "./Logo";
import Link from "next/link";
import { Button } from "./ui/button";
import { navigation, navLinks } from "@/lib/constants";
import useAuth from "@/hooks/useAuth";
import { CustomSheet } from "./home/CustomSheet";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

export default function Navbar() {
	const { artist } = useAuth();
	const pathname = usePathname();
	return (
		<div className="w-full px-4 md:px-6">
			<div className="w-full mx-auto max-w-7xl flex justify-between items-start py-6">
				<Logo link />
				<div className="lg:flex items-center gap-x-6 hidden">
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

				{artist ? (
					<Link href={"/dashboard"}>
						<Button>Dashboard</Button>
					</Link>
				) : (
					<div className="lg:flex items-center gap-x-3 hidden">
						<Link href={"/artists"}>
							<Button>Explore All Artists</Button>
						</Link>
						<Link href="/onboarding">
							<Button variant={"outline"}>
								Join as an artist
							</Button>
						</Link>
					</div>
				)}

				<CustomSheet
					trigger={
						<Button variant={"ghost"} className="block lg:hidden">
							<Menu className="h-5 w-5" />
						</Button>
					}
				>
					<div className="py-4 space-y-4">
						<div className="flex flex-col gap-x-6">
							{navLinks?.map(({ Icon, href, label }) => (
								<Link
									key={href}
									href={href}
									className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2  hover:text-foreground ${
										pathname === href
											? "text-foreground bg-muted"
											: "text-muted-foreground"
									}`}
								>
									<Icon className="h-5 w-5" />
									{label}
								</Link>
							))}
						</div>
						<div>
							{artist ? (
								<Link href={"/dashboard"}>
									<Button>Dashboard</Button>
								</Link>
							) : (
								<div className="flex flex-col space-y-2">
									<Link href={"/artists"}>
										<Button className="w-full">
											Explore All Artists
										</Button>
									</Link>
									<Link href="/onboarding">
										<Button
											variant={"outline"}
											className="w-full"
										>
											Join as an artist
										</Button>
									</Link>
								</div>
							)}
						</div>
					</div>
				</CustomSheet>
			</div>
		</div>
	);
}
