import { showShareProfileState } from "@/atoms";
import IncomeStats from "@/components/dashboard/IncomeStats";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import LikesAndPlaysStats from "@/components/dashboard/LikesAndPlays";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useAuth from "@/hooks/useAuth";
import axios from "@/lib/axios.config";
import { generatePageTitle } from "@/lib/utils";
import { DollarSign, Music, Play, ThumbsUp } from "lucide-react";
import Head from "next/head";
import { FiShare } from "react-icons/fi";
import { useRecoilState } from "recoil";
import useSWR from "swr";

export default function Overview() {
  const { artist } = useAuth();
  const [, setShowShareProfile] = useRecoilState(showShareProfileState);

  const { data: revenueData, mutate: refetchRevenue } = useSWR(
    "/supports/current-month-revenue/by-artist/" + artist?._id,
    async (url) => {
      if (!artist) return { totalRevenue: 0, percentageChange: 0 };
      const { data } = await axios.get(url);
      return {
        totalRevenue: data.totalRevenue,
        percentageChange: data.percentageChange,
      } as { totalRevenue: number; percentageChange: number };
    },
  );

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleWithdraw = async () => {
    if (!artist) return;
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      // you may replace with a toast notification
      alert('Please enter a valid amount');
      return;
    }
    try {
      await axios.post('/api/payments/withdraw', {
        amount,
        artistId: artist._id,
      });
      // refresh revenue after withdrawal
      refetchRevenue();
      setShowWithdraw(false);
      setWithdrawAmount('');
      alert('Withdrawal successful');
    } catch (e) {
      console.error(e);
      alert('Withdrawal failed');
    }
  };

  const { data: likesData, mutate: refetchLikes } = useSWR(
    "/arts/current-month-plays-analytics/by-artist/" + artist?._id,
    async (url) => {
      if (!artist) return { totalLikes: 0, percentageChange: 0 };
      const { data } = await axios.get(url);
      return {
        totalLikes: data.totalLikes,
        percentageChange: data.percentageChange,
      } as { totalLikes: number; percentageChange: number };
    },
  );

  const { data: playData, mutate: refetchPlays } = useSWR(
    "/arts/current-month-plays-analytics/by-artist/" + artist?._id,
    async (url) => {
      if (!artist) return { totalPlays: 0, percentageChange: 0 };
      const { data } = await axios.get(url);
      return {
        totalPlays: data.totalPlays,
        percentageChange: data.percentageChange,
      } as { totalPlays: number; percentageChange: string };
    },
  );

  const { data: preReleaseData, mutate: refetchPreRelease } = useSWR(
    "/arts/pre-releases/total/by-artist/" + artist?._id,
    async (url) => {
      if (!artist) return { totalPreReleases: 0 };
      const { data } = await axios.get(url);
      return {
        totalPreReleases: data.totalPreReleases,
      } as { totalPreReleases: number };
    },
  );

  return (
    <>
      <Head>
        <title>{generatePageTitle("Your dashboard")}</title>
      </Head>
      <DashboardLayout>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 px-4 md:px-6 w-full ">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-5">
            <Card x-chunk="dashboard-01-chunk-0">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RWF
                  {revenueData?.totalRevenue?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{revenueData?.percentageChange || 0}
                </p>
              </CardContent>
            </Card>
            <Card x-chunk="dashboard-01-chunk-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Plays
                </CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {playData?.totalPlays?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{playData?.percentageChange || 0}
                </p>
              </CardContent>
            </Card>
            <Card x-chunk="dashboard-01-chunk-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Likes
                </CardTitle>
                <ThumbsUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {likesData?.totalLikes?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{likesData?.percentageChange || 0}
                </p>
              </CardContent>
            </Card>
            <Card x-chunk="dashboard-01-chunk-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pre-releases
                </CardTitle>
                <Music className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {preReleaseData?.totalPreReleases?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="flex items-center justify-center ">
              <Button
                onClick={() =>
                  setShowShareProfile({
                    show: true,
                    artistId: artist!._id,
                  })
                }
                className="gap-x-3"
              >
                <FiShare />
                <p>Share Your profile</p>
              </Button>
            </Card>
          </div>

          <IncomeStats />
          <LikesAndPlaysStats />
        </main>
      </DashboardLayout>
    </>
  );
}
