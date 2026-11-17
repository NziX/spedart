import {
	AudioLines,
	CircleDollarSign,
	Headphones,
	Home,
	UserCog2,
} from "lucide-react";

export const navLinks: {
	label: string;
	href: string;
	Icon: any;
}[] = [
	{
		label: "Overview",
		href: "/dashboard",
		Icon: Home,
	},
	{
		label: "Artists",
		href: "/dashboard/artists",
		Icon: Headphones,
	},
	{
		label: "Arts",
		href: "/dashboard/arts",
		Icon: AudioLines,
	},
	{
		label: "Payments",
		href: "/dashboard/payments",
		Icon: CircleDollarSign,
	},
	{
		label: "Admins",
		href: "/dashboard/admins",
		Icon: UserCog2,
	},
	{
		label: "Support",
		href: "/dashboard/messages",
		Icon: Headphones,
	},
];
