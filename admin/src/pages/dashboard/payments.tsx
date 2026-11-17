import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import TableWrapper from "@/components/tables/TableWrapper";
import React, { useMemo } from "react";
import { faker } from "@faker-js/faker";
import { Column } from "@/components/tables/Table";
import { EPaymentStatus, Payment } from "@/types";
import { Button } from "@mantine/core";
import { Badge } from "@/components/ui/badge";
import useSWR from "swr";
import axios from "@/lib/axios.config";

const columns: Column<Payment>[] = [
	{
		title: "Full Names",
		key: "providedBy.name",
		Element: ({ row }) => row.providedBy?.name,
	},
	{
		title: "Phone Number",
		key: "providedBy.name",
		Element: ({ row }) => row.providedBy?.phoneNumber,
	},
	{
		title: "Amount",
		key: "amount",
		Element: ({ row }) => (
			<span>
				{row.currency} {row.amount}
			</span>
		),
	},
	{
		title: "Payment Type",
		key: "type",
	},
	{
		title: "Status",
		key: "status",
		Element: ({ row }) => (
			<Badge color={row.status === EPaymentStatus.PAID ? "green" : "red"}>
				{row.status}
			</Badge>
		),
	},
	{
		title: "Date",
		key: "date",
		Element: ({ row }) => (
			<span>{`${row.createdAt?.split("T")[0]} ${
				row.createdAt?.split("T")[1]?.split(".")[0]
			}`}</span>
		),
	},
];

export default function Payments() {
	const {
		data: payments,
		error,
		mutate,
		isLoading: loadingPayments,
	} = useSWR("/supports", async (url) => {
		const { data } = await axios.get(url);
		return data?.supports;
	});

	return (
		<DashboardLayout>
			<TableWrapper
				title="Payments"
				description="All payments made on the platform, either support or song purchase"
				columns={columns}
				data={payments}
				loading={loadingPayments}
			/>
		</DashboardLayout>
	);
}
