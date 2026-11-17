import EmptyView from "@/components/EmptyView";
import ExploreLayout from "@/components/layouts/ExploreLayout";
import LoadingView from "@/components/LoadingView";
import Song from "@/components/Song";
import { generatePageTitle } from "@/lib/utils";
import { useGetPreReleases } from "@/services/pre-releases";
import Head from "next/head";

// export const getStaticProps: GetStaticProps = async () => {
// 	try {
// 		const { data } = await axios.get("/arts/pre-releases");
// 		return {
// 			props: {
// 				arts: data?.arts,
// 			},
// 			revalidate: 60
// 		};
// 	} catch (error) {
// 		console.log("there was an error", error);

// 		return {
// 			props: {
// 				arts: [],
// 			},
// 		};
// 	}
// };

export default function PreReleases() {

	const {
		data: arts,
		isLoading: fetchingArts,
	} = useGetPreReleases();
	return (
		<>
			<Head>
				<title> {generatePageTitle("Pre-released songs")}</title>
			</Head>
			<ExploreLayout>
				<main className="w-full min-h-[70vh] my-12 px-6">
					{
						fetchingArts ? (
							<LoadingView
								message="Loading Pre-Releases ..."
							/>
						) :
							arts?.length === 0 ? (
								<EmptyView message="No Pre-Releases Available At The Moment" />
							) : (
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
									{arts?.map((art, idx) => (
										<Song key={idx} {...art} />
									))}
								</div>
							)}
				</main>
			</ExploreLayout>
		</>
	);
}
