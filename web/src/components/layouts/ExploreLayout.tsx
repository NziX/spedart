import { Menu, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import Footer from "../Footer";
import Logo from "../Logo";
import { Input } from "../ui/input";
import { CustomSheet } from "../home/CustomSheet";
import { Button } from "../ui/button";

interface ExploreProps {
	children: React.ReactElement;
}

const links: {
	label: string;
	href: string;
}[] = [
	{
		label: "Explore Our Artists",
		href: "/artists",
	},
	{
		label: "Discover Pre-Releases",
		href: "/pre-releases",
	},
];

export default function ExploreLayout({ children }: ExploreProps) {
	const pathname = usePathname();
	const [search, setSearch] = React.useState("");

	return (
		<div className="max-w-7xl w-full mx-auto">
			<div className="px-4 md:px-6  flex items-center justify-between py-6">
				<Logo link />
				{/* <div className="hidden lg:block relative bg-primary-background">
					<Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search by artists, songs or albums"
						className="md:min-w-[30rem] lg:min-w-[35rem] pl-10 bg-primary-background"
					/>
				</div> */}
				<div className="hidden lg:flex gap-x-3">
					{links.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={`text-sm font-semibold p-2 rounded ${
								pathname === link.href
									? "text-primary-text bg-[#FAECFF]"
									: "text-gray-500"
							}`}
						>
							{link.label}
						</Link>
					))}
				</div>
				<CustomSheet
					trigger={
						<Button variant={"ghost"} className="lg:hidden block">
							<Menu />
						</Button>
					}
				>
					<div className="flex space-y-2 py-4 flex-col">
						<div className="flex flex-col my-2">
							{links.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className={`text-sm font-semibold p-2 rounded ${
										pathname === link.href
											? "text-primary-text bg-[#FAECFF]"
											: "text-gray-500"
									}`}
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
					{/* <div className="relative bg-primary-background">
						<Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-500" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by artists, songs or albums"
							className="md:min-w-[30rem] lg:min-w-[35rem] pl-10 bg-primary-background"
						/>
					</div> */}
				</CustomSheet>
			</div>
			{children}
			<Footer />
		</div>
	);
}
