import { LogOut, Menu, Package2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import useAuth from "@/hooks/useAuth";
import { appName } from "@/lib/constants";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { usePathname } from "next/navigation";
import { Avatar, AvatarImage } from "../ui/avatar";
import { FaMoneyBill } from "react-icons/fa6";
import { useRecoilState } from "recoil";
import { showBalanceState } from "@/atoms";

const links: {
  label: string;
  href: string;
}[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Income",
    href: "/dashboard/income",
  },
  {
    label: "Pre-releases",
    href: "/dashboard/pre-releases",
  },
  {
    label: "Account Settings",
    href: "/dashboard/account",
  },
];

export default function DashboardNavbar() {
  const pathname = usePathname();
  const { logout, artist } = useAuth();
  const [, setShowBalanceModal] = useRecoilState(showBalanceState);

  return (
    <header className="sticky top-0 border-b bg-background px-4 md:px-6 bg-white z-50">
      <div className="flex h-16 items-center gap-4 max-w-[90rem] w-full mx-auto">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Package2 className="h-6 w-6" />
            <span className="sr-only">{appName}</span>
          </Link>

          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-foreground shrink-0 ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="grid gap-6 text-lg font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Package2 className="h-6 w-6" />
                <span className="sr-only">{appName}</span>
              </Link>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors hover:text-foreground shrink-0 ${
                    pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
          <div className="ml-auto flex-1 sm:flex-initial" />
          <DropdownMenu>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() =>
                  setShowBalanceModal({
                    artistId: artist?._id!,
                    show: true,
                  })
                }
                variant={"default"}
                className="space-x-2"
              >
                <FaMoneyBill />
                <p>Balance</p>
              </Button>
            </div>
            <div className="flex items-center gap-x-2">
              <div className="text-sm">
                <p className="font-medium capitalize">
                  {artist?.firstName} {artist?.lastName}
                </p>
                <p className="text-xs">{artist?.stageName}</p>
              </div>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full"
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage
                        src={artist?.profilePicture}
                        className="object-cover border"
                      />
                      <AvatarFallback>{`${artist?.firstName[0]} ${artist?.lastName[0]}`}</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="sr-only">Toggle user menu</span>
                </Button>
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link href="/dashboard/account">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <button
                  className="flex items-center gap-x-2 text-red-500 hover:text-red-700"
                  onClick={() => logout()}
                >
                  <span className="pr-2">Logout</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
