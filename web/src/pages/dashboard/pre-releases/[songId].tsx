import DashboardLayout from "@/components/layouts/DashboardLayout";
import AddOrEditPreRelease from "@/components/pre-release/AddOrEditPreRelease";
import axios from "@/lib/axios.config";
import { generatePageTitle } from "@/lib/utils";
import { Art } from "@/types";
import { GetServerSideProps } from "next";
import Head from "next/head";

export const getServerSideProps: GetServerSideProps = async (context: any) => {
	const { songId } = context.params;
	try {
		const { data } = await axios.get(`/arts/by-art/${songId}`);
		if (!data) {
			return {
				notFound: true,
			};
		}
		return {
			props: {
				song: data.art,
			},
		};
	} catch (error) {
		console.error(error);
		return {
			notFound: true,
		};
	}
};

export default function PreReleaseView({ song }: { song: Art }) {
	return (
		<>
			<Head>
				<title>{generatePageTitle(song.title)}</title>
			</Head>
			<DashboardLayout>
				<AddOrEditPreRelease action="edit" song={song} />
			</DashboardLayout>
		</>
	);
}
