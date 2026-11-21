import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import React from "react";
import { AudioLines, CircleDollarSign, Headphones } from "lucide-react";
import useSWR from "swr";
import axios from "@/lib/axios.config";

export default function Overview() {
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      await axios.post('/api/payments/withdraw', {
        amount,
        // admin context may not need artistId; using adminId if needed
      });
      // Ideally refetch some revenue data if displayed; using refetchIncome if needed
      setShowWithdraw(false);
      setWithdrawAmount('');
      alert('Withdrawal successful');
    } catch (e) {
      console.error(e);
      alert('Withdrawal failed');
    }
  };

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
					{/* Withdraw button for admin */}
					<Card className="flex items-center justify-center gap-4">
					  <Button onClick={() => setShowWithdraw(true)} className="gap-x-3">
					    Withdraw
					  </Button>
					</Card>

					<Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
					  <DialogContent>
					    <DialogHeader>
					      <DialogTitle>Withdraw Funds</DialogTitle>
					      <DialogDescription>Enter the amount you wish to withdraw.</DialogDescription>
					    </DialogHeader>
					    <Input
					      placeholder="Amount"
					      type="number"
					      value={withdrawAmount}
					      onChange={e => setWithdrawAmount(e.target.value)}
					    />
					    <DialogFooter>
					      <Button variant="outline" onClick={() => setShowWithdraw(false)}>Cancel</Button>
					      <Button onClick={handleWithdraw}>Confirm</Button>
					    </DialogFooter>
					  </DialogContent>
					</Dialog>
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
