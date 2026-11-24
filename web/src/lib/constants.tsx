import { IArtist, IPreRelease } from "@/types";
import { Home, Info, Mail, Music } from "lucide-react";

export const UIDHASH = "mklazMMMKKLLLLDDEETTIIaxhs";

export const navigation: {
	label: string;
	href: string;
}[] = [
		{
			label: "Home",
			href: "/",
		},
		{
			label: "About",
			href: "/about",
		},
		{
			label: "Pre-released Tracks",
			href: "/pre-releases",
		},
		{
			label: "Contact Us",
			href: "/contact",
		},
	];

export const appName = "spedArt";
export const contacts = {
	phone: "+25078976444",
	email: "supportmainspedart@gmail.com",
};

export const artists = [
	{
		name: "Davy Scott",
		songs: 23,
		verified: true,
		profilePicture: "/artists/1.png",
	},
	{
		name: "Ish Kevin",
		songs: 12,
		verified: true,
		profilePicture: "/artists/2.png",
	},
	{
		name: "Bruce Melody",
		songs: 10,
		verified: true,
		profilePicture: "/artists/3.png",
	},
	{
		name: "Kivumbi King",
		songs: 4,
		profilePicture: "/artists/4.png",
	},
	{
		name: "Element Eleh",
		songs: 3,
		profilePicture: "/artists/5.png",
	},
	{
		name: "Alyn Sano",
		songs: 26,
		profilePicture: "/artists/6.png",
		verified: true,
	},
	{
		name: "Chris Eazy",
		songs: 14,
		verified: true,
		profilePicture: "/artists/7.png",
	},
	{
		name: "Logan Joe",
		songs: 6,
		verified: true,
		profilePicture: "/artists/8.png",
	},
	{
		name: "Bruce the 1st",
		songs: 8,
		profilePicture: "/artists/9.png",
	},
	{
		name: "Ariel  Wayz",
		songs: 2,
		profilePicture: "/artists/10.png",
		socials: {
			twitter: "https://twitter.com",
			facebook: "https://facebook.com",
			instagram: "https://instagram.com",
		},
	},
];

// create and export navLinks for Home, About, Pre-released Tracks, and Contact Us
export const navLinks: {
	Icon: any;
	label: string;
	href: string;
}[] = [
		{
			Icon: Home,
			label: "Home",
			href: "/",
		},
		{
			Icon: Info,
			label: "About",
			href: "/about",
		},
		{
			Icon: Music,
			label: "Pre-released Tracks",
			href: "/pre-releases",
		},
		{
			Icon: Mail,
			label: "Contact Us",
			href: "/contact",
		},
	];

export const song = {
	title: "Ntiwamvamo",
	artists: ["Logan Joe", "Kenny k-shot"],
	likes: 10,
	plays: 123,
	thumbnail: "/songs/1.png",
	price: 24,
};
