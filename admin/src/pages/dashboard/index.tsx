import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import React from "react";
import { AudioLines, CircleDollarSign, Headphones } from "lucide-react";
import useSWR from "swr";
import axios from "@/lib/axios.config";

export default function Overview() {
	const { data: arts, isLoading: loadingArts } = useSWR(
		"/arts/total-arts",
		async (url) => {
			const { data } = await axios.get(url);
			return data?.totalArts as number;
		}
	);

	const { data: paymemts, isLoading: loadingPayments } = useSWR(
		"/supports/total-payments",
		async (url) => {
			const { data } = await axios.get(url);
			return data?.totalPayments as number;
		}
	);

	const { data: income, isLoading: loadingIncome } = useSWR(
		"/supports/total-interest",
		async (url) => {
			const { data } = await axios.get(url);
			return data?.totalInterest as number;
		}
	);

	const { data: artists, isLoading: loadingArtists } = useSWR(
		"/artists/total-artists",
		async (url) => {
			const { data } = await axios.get(url);
			return data?.totalArtists as number;
		}
	);

	return (
		<DashboardLayout>
			<div>
				<div>
					<h1 className="text-xl font-semibold ">Overview</h1>
					<p className="text-gray-600">Summary of the platform</p>
				</div>
				<div className="mt-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						<StatsCard
							title="Total payments"
							value={`RWF ${paymemts?.toLocaleString() || 0}`}
							href="/dashboard/payments"
							Icon={CircleDollarSign}
						/>
						<StatsCard
							title="Total Income"
							value={`RWF ${income?.toLocaleString() || 0}`}
							// href="/dashboard/payments"
							Icon={CircleDollarSign}
						/>
						<StatsCard
							title="Total Artists"
							value={artists?.toLocaleString() || "0"}
							href="/dashboard/artists"
							Icon={Headphones}
						/>
						<StatsCard
							title="Total Arts"
							value={arts?.toLocaleString() || "0"}
							href="/dashboard/arts"
							Icon={AudioLines}
						/>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
}

const StatsCard = ({
	value,
	title,
	href,
	Icon,
}: {
	title: string;
	value: string;
	Icon: any;
	href?: string;
}) => {
	return (
		<Card className="flex flex-col items-center gap-y-4 py-6">
			<Icon className="w-6 h-6" />
			<CardDescription className="text-lg">{title}</CardDescription>
			<CardTitle>{value}</CardTitle>
			{href && (
				<Link href={href} className="text-primary">
					<p>View more &rarr;</p>
				</Link>
			)}
		</Card>
	);
};
