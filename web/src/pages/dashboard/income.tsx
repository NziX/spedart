import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useArtistPayments from "@/hooks/useArtistPayments";
import useAuth from "@/hooks/useAuth";
import axios from "@/lib/axios.config";
import { generatePageTitle } from "@/lib/utils";
import { EPaymentStatus, EPaymentType, Payment } from "@/types";
import { downloadReport } from "@/utils/generateReport";
import { Download } from "lucide-react";
import Head from "next/head";
import { useEffect } from "react";
import useSWR from "swr";

const purchaseColumns: Column<Payment>[] = [
  {
    title: "Amount",
    key: "amount",
    Element: ({ row }) => <span>RWF {row.amount}</span>,
  },
  {
    title: "Provided By",
    key: "providedBy",
    Element: ({ row }) => (
      <div>
        <p>{row.providedBy?.name}</p>
        <p>{row.providedBy?.email}</p>
      </div>
    ),
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
        row.createdAt?.split("T")[1].split(".")[0]
      }`}</span>
    ),
  },
  {
    title: "Song",
    key: "art",
    Element: ({ row }) => <span>{row.art?.title}</span>,
  },
];

const supportColumns: Column<Payment>[] = [
  {
    title: "Amount",
    key: "amount",
    Element: ({ row }) => <span>RWF {row.amount}</span>,
  },
  {
    title: "Provided By",
    key: "providedBy",
    Element: ({ row }) => (
      <div>
        <p>{row.providedBy?.name}</p>
        <p>{row.providedBy?.email}</p>
      </div>
    ),
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
        row.createdAt?.split("T")[1].split(".")[0]
      }`}</span>
    ),
  },
  {
    title: "Comment",
    key: "comment",
    Element: ({ row }) => <p className="max-w-lg">{row.comment ?? "N/A"}</p>,
  },
];

export default function Income() {
  const { artist } = useAuth();
  const {
    data: payments,
    error,
    mutate,
    isLoading: loadingPayments,
  } = useSWR("/supports/by-artist/" + artist?._id, async (url) => {
    if (!artist) return [];
    const { data } = await axios.get(url);
    return data?.payments as Payment[];
  });

  useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist]);

  return (
    <>
      <Head>
        <title>{generatePageTitle("Your Income")}</title>
      </Head>
      <DashboardLayout>
        <Tabs defaultValue="purchases" className="w-full p-4 md:p-6">
          <TabsList className="grid  grid-cols-2 md:w-[400px] w-full">
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>
          <TabsContent value="purchases" className="w-full">
            <TableWrapper
              columns={purchaseColumns}
              data={
                payments?.filter((p) => p.type === EPaymentType.PURCHASE) ?? []
              }
              title="Purchases"
              description="View all your purchases of pre-releases"
              emptyMessage="No one has purchased any of your pre-releases yet"
              loading={loadingPayments}
              actions={
                <>
                  {(
                    payments?.filter((p) => p.type === EPaymentType.PURCHASE) ??
                    []
                  ).length > 0 && (
                    <Button
                      className="items-center gap-x-2"
                      onClick={() =>
                        downloadReport(
                          payments
                            ?.filter((p) => p.type === EPaymentType.PURCHASE)
                            .map((item) => ({
                              Amount: item.amount,
                              "Provided By": item.providedBy?.name,
                              Status: item.status,
                              Date: `${item.createdAt?.split("T")[0]} ${
                                item.createdAt?.split("T")[1].split(".")[0]
                              }`,
                              Song: item.art?.title,
                            })) ?? [],
                        )
                      }
                    >
                      <Download size={16} />
                      Download Report
                    </Button>
                  )}
                </>
              }
            />
          </TabsContent>
          <TabsContent value="support" className="w-full">
            <TableWrapper
              columns={supportColumns}
              data={
                payments?.filter((p) => p.type === EPaymentType.SUPPORT) ?? []
              }
              title="Support"
              description="View all supports provided by different fans"
              loading={loadingPayments}
              emptyMessage="No one has supported you yet"
              actions={
                <>
                  {(
                    payments?.filter((p) => p.type === EPaymentType.SUPPORT) ??
                    []
                  ).length > 0 && (
                    <div className="items-center gap-x-2">
                      <Button
                        className="items-center gap-x-2"
                        onClick={() =>
                          downloadReport(
                            payments
                              ?.filter((p) => p.type === EPaymentType.PURCHASE)
                              .map((item) => ({
                                Amount: item.amount,
                                "Provided By": item.providedBy?.name,
                                Status: item.status,
                                Date: `${item.createdAt?.split("T")[0]} ${
                                  item.createdAt?.split("T")[1].split(".")[0]
                                }`,
                                Song: item.art?.title,
                              })) ?? [],
                          )
                        }
                      >
                        <Download size={16} />
                        Download Report
                      </Button>
                    </div>
                  )}
                </>
              }
            />
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </>
  );
}
