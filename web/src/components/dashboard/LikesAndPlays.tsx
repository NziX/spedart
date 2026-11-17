"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import useAuth from "@/hooks/useAuth";
import useSWR from "swr";
import axios from "@/lib/axios.config";

type TChartData = {
	date: string;
	likes: number;
	plays: number;
};

const chartConfig = {
	views: {
		label: "Value",
	},
	likes: {
		label: "Likes",
		color: "hsl(var(--chart-2))",
	},
	plays: {
		label: "Plays",
		color: "hsl(var(--chart-1))",
	},
} satisfies ChartConfig;

export default function LikesAndPlaysStats() {
	const [activeChart, setActiveChart] =
		React.useState<keyof typeof chartConfig>("likes");

	const { artist } = useAuth();

	const {
		data: chartData,
		error,
		mutate,
	} = useSWR(
		"/arts/get-fan-interactivity/by-artist/" + artist?._id,
		async (url) => {
			if (!artist) return [];
			const currentDate = new Date();
			const startDate = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth() - 3,
				currentDate.getDate()
			);
			const endDate = currentDate;
			const { data } = await axios.get(
				url + `?startDate=${startDate}&endDate=${endDate}`
			);
			return data.data as TChartData[];
		}
	);

	React.useEffect(() => {
		mutate();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [artist]);

	const total = React.useMemo(
		() => ({
			likes: chartData?.reduce((acc, curr) => acc + curr.likes, 0),
			plays: chartData?.reduce((acc, curr) => acc + curr.plays, 0),
		}),
		[chartData]
	);

	return (
		<Card>
			<CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
				<div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
					<CardTitle>Fans Interactivity</CardTitle>
					<CardDescription>
						Showing total likes and plays for the last 3 months
					</CardDescription>
				</div>
				<div className="flex">
					{["likes", "plays"].map((key) => {
						const chart = key as keyof typeof chartConfig;
						return (
							<button
								key={chart}
								data-active={activeChart === chart}
								className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
								onClick={() => setActiveChart(chart)}
							>
								<span className="text-xs text-muted-foreground">
									{chartConfig[chart].label}
								</span>
								<span className="text-lg font-bold leading-none sm:text-3xl">
									{total[
										key as keyof typeof total
									]?.toLocaleString() ?? 0}
								</span>
							</button>
						);
					})}
				</div>
			</CardHeader>
			<CardContent className="px-2 sm:p-6">
				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[500px] w-full"
				>
					<BarChart
						accessibilityLayer
						data={chartData}
						height={500}
						margin={{
							left: 12,
							right: 12,
						}}
					>
						<CartesianGrid vertical={false} />
						<XAxis
							dataKey="date"
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							minTickGap={32}
							tickFormatter={(value) => {
								const date = new Date(value);
								return date.toLocaleDateString("en-US", {
									month: "short",
									day: "numeric",
								});
							}}
						/>
						<ChartTooltip
							content={
								<ChartTooltipContent
									className="w-[450px]"
									nameKey="views"
									labelFormatter={(value) => {
										return new Date(
											value
										).toLocaleDateString("en-US", {
											month: "short",
											day: "numeric",
											year: "numeric",
										});
									}}
								/>
							}
						/>
						<Bar
							dataKey={activeChart}
							fill={`var(--color-${activeChart})`}
						/>
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
