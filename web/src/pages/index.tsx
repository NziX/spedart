import { ArtistsCarousel } from "@/components/home/ArtistsCarausel";
import CTA from "@/components/home/CTA";
import EarlyAccess from "@/components/home/EarlyAccess";
import EmpowerArtists from "@/components/home/EmpowerArtists";
import ForArtists from "@/components/home/ForArtists";
import Hero from "@/components/home/Hero";
import Testimonials from "@/components/home/Testimonials";
import MainLayout from "@/components/layouts/MainLayout";
import Head from "next/head";

export default function Home() {
	return (
		<>
			<Head>
				<title>Welcome to supported</title>
			</Head>
			<MainLayout>
				<Hero />
				<ForArtists />
				<EmpowerArtists />
				<Testimonials />
				{/* <EarlyAccess /> */}
				<ArtistsCarousel />
				<CTA />
			</MainLayout>
		</>
	);
}
