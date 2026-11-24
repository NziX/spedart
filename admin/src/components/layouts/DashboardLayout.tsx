import { CircleUser, Menu, Package2 } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "@/lib/constants";
import { usePathname } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import axios from "@/lib/axios.config";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { admin, logout } = useAuth();

	const { data: pendingData } = useSWR(
		admin ? "/admin/artists/pending-count" : null,
		async (url) => {
			try {
				const { data } = await axios.get(url);
				return data?.count || 0;
			} catch (e) {
				return 0;
			}
		},
		{ refreshInterval: 15000 }
	);
	const pendingCount = pendingData ?? 0;

	return (
		<div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
			<div className="hidden border-r bg-muted/40 md:block">
				<div className="flex h-full max-h-screen flex-col gap-2">
					<div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
						<Link
							href="/dashboard"
							className="flex items-center gap-2 font-semibold"
						>
							<Package2 className="h-6 w-6" />
							<span className="">Supported</span>
						</Link>
					</div>
					<div className="flex-1">
						<nav className="grid items-start px-2 text-sm font-medium lg:px-4">
							{navLinks?.map(({ Icon, href, label, badgeKey }) => (
								<Link
									key={href}
									href={href}
									className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
										pathname === href
											? "bg-muted text-primary"
											: "text-muted-foreground"
									}`}
								>
									<Icon className="h-4 w-4" />
									<span className="flex-1">{label}</span>
									{badgeKey === "pendingArtists" && pendingCount > 0 && (
										<Badge variant="destructive" className="ml-auto text-xs px-2 py-0.5">
											{pendingCount}
										</Badge>
									)}
								</Link>
							))}
						</nav>
					</div>
				</div>
			</div>
			<div className="flex flex-col">
				<header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
					<Sheet>
						<SheetTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="shrink-0 md:hidden"
							>
								<Menu className="h-5 w-5" />
								<span className="sr-only">
									Toggle navigation menu
								</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="left" className="flex flex-col">
							<nav className="grid gap-2 text-lg font-medium">
								<Link
									href="/dashboard"
									className="flex items-center gap-2 text-lg font-semibold"
								>
									<Package2 className="h-6 w-6" />
									<span className="sr-only">Supported</span>
								</Link>
								{navLinks?.map(({ Icon, href, label, badgeKey }) => (
									<Link
										key={href}
										href={href}
										className={`mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground ${
											pathname === href
												? "text-foreground bg-muted"
												: "text-muted-foreground"
										}`}
									>
										<Icon className="h-5 w-5" />
										<span className="flex-1">{label}</span>
										{badgeKey === "pendingArtists" && pendingCount > 0 && (
											<Badge variant="destructive" className="ml-auto text-xs px-2 py-0.5">
												{pendingCount}
											</Badge>
										)}
									</Link>
								))}
							</nav>
						</SheetContent>
					</Sheet>
					<div className="w-full flex-1" />
					<div className="flex items-center gap-x-2">
						<div>
							<p className="text-sm font-medium">
								{admin?.username}
							</p>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="secondary"
									size="icon"
									className="rounded-full"
								>
									<CircleUser className="h-5 w-5" />
									<span className="sr-only">
										Toggle user menu
									</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>
									My Account
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => logout()}>
									Logout
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
					{children}
				</main>
			</div>
		</div>
	);
}
