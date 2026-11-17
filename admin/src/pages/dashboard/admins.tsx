import CreateAdminModal from "@/components/admin/createAdmin";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import axios from "@/lib/axios.config";
import { IAdmin } from "@/types";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import useSWR from "swr";

export default function Admins() {
	const {
		data: admins,
		error,
		mutate,
		isLoading: loadingAdmins,
	} = useSWR("/admin/admins", async (url) => {
		const { data } = await axios.get(url);
		return data?.admins;
	});

	const deleteAdmin = async (id: string) => {
		try {
			await axios.delete(`/admin/delete-admin/${id}`);
			mutate();
			notifications.show({
				message: "Admin deleted successfully",
				color: "green",
			});
		} catch (error) {
			notifications.show({
				message: "Failed to delete admin",
				color: "red",
			});
		}
	};

	const columns: Column<IAdmin>[] = [
		{
			title: "Name",
			key: "username",
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
				<div className="flex gap-x-3">
					<Button
						variant="outline"
						color="red"
						onClick={() => deleteAdmin(row._id)}
					>
						Delete
					</Button>
				</div>
			),
		},
	];

	return (
		<DashboardLayout>
			<TableWrapper
				title="Admins"
				columns={columns}
				data={admins}
				loading={loadingAdmins}
				error={error}
				actions={
					<CreateAdminModal
						onCreate={() => {
							mutate();
						}}
						trigger={<Button variant="filled">Create Admin</Button>}
					/>
				}
			/>
		</DashboardLayout>
	);
}
