import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import ViewContactMessage from "@/components/messages/viewMessage";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import axios from "@/lib/axios.config";
import { IContactMessage } from "@/types";
import { Button } from "@mantine/core";
import useSWR from "swr";

export default function ContactMessages() {
	const {
		data: contactMessages,
		error,
		mutate,
		isLoading: loadingContactMessages,
	} = useSWR("/contact-messages", async (url) => {
		const { data } = await axios.get(url);
		return data?.contactMessages;
	});

	const columns: Column<IContactMessage>[] = [
		{
			title: "Name",
			key: "name",
		},
		{
			title: "Email",
			key: "email",
		},
		{
			title: "Created On",
			key: "createdAt",
			Element: ({ row }) =>
				new Date(row.createdAt).toLocaleString("en-US"),
		},
		{
			title: "Actions",
			key: "actions",
			Element: ({ row }) => (
				<ViewContactMessage
					trigger={
						<Button
							variant="outline"
							color="teal"
							// onClick={() => deleteAdmin(row._id)}
						>
							View
						</Button>
					}
					message={row}
				/>
			),
		},
	];

	return (
		<DashboardLayout>
			<TableWrapper
				title="Contact Messages"
				columns={columns}
				data={contactMessages}
				loading={loadingContactMessages}
				error={error}
			/>
		</DashboardLayout>
	);
}
