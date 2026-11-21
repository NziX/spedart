import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import axios from "@/lib/axios.config";
import { Art } from "@/types";
import useSWR from "swr";
import Image from "next/image";

const columns: Column<Art>[] = [
	{
		title: "Title",
		key: "title",
	},
	{
		title: "Artist",
		key: "artist",
		Element: ({ row }) => (
			<div className="flex gap-x-3">
				<Image
					src={row.artist.profilePicture}
					alt={row.artist.firstName + " " + row.artist.lastName}
					width={48}
					height={48}
					className="w-12 h-12"
				/>
				<span>
					{row.artist.firstName} {row.artist.lastName}
				</span>
			</div>
		),
	},
	{
		title: "Type",
		key: "type",
	},
	{
		title: "Thumbnail",
		key: "thumbnail",
		Element: ({ row }) => (
			<Image
				src={row.thumbnail}
				alt={row.title}
				width={48}
				height={48}
				className="w-12 h-12"
			/>
		),
	},
	{
		title: "Description",
		key: "description",
		Element: ({ row }) => <span>{row.description ?? "N/A"}</span>,
	},
	{
		title: "Pricing",
		key: "pricing",
		Element: ({ row }) => (
			<span>
				{row.pricing.paid
					? `${row.pricing.currency} ${row.pricing.price}`
					: "Free"}
			</span>
		),
	},
	// {
	// 	title: "Status",
	// 	key: "status",
	// 	Element: ({ row }) => (
	// 		<Badge
	// 			variant={row.status === "AVAILABLE" ? "default" : "destructive"}
	// 		>
	// 			{row.status}
	// 		</Badge>
	// 	),
	// },
	{
		title: "Likes",
		key: "likes",
	},
	{
		title: "Streams",
		key: "streams",
	},
	// {
	// 	title: "Actions",
	// 	key: "actions",
	// 	Element: ({ row }) => (
	// 		<div className="flex gap-x-3">
	// 			<Button variant="outline">Edit</Button>
	// 			<Button variant="outline" color="red">
	// 				Delete
	// 			</Button>
	// 		</div>
	// 	),
	// },
];

export default function Arts() {
	const {
		data: arts,
		error,
		mutate,
		isLoading: loadingArts,
	} = useSWR("/arts", async (url) => {
		const { data } = await axios.get(url);
		return data?.arts;
	});

	return (
		<DashboardLayout>
			<TableWrapper
				title="Arts"
				description="List of all arts on the platform"
				// actions={<Button>Add Art</Button>}
				columns={columns}
				data={arts}
				loading={loadingArts}
			/>
		</DashboardLayout>
	);
}
