/* eslint-disable @next/next/no-img-element */
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import { Button } from "@/components/ui/button";
import useArtistArts from "@/hooks/useArtistArts";
import { generatePageTitle } from "@/lib/utils";
import { Art } from "@/types";
import { Plus } from "lucide-react";
import Head from "next/head";
import Link from "next/link";

const columns: Column<Art>[] = [
  {
    title: "Thumbnail",
    key: "thumbnail",
    Element: ({ row }) => (
      <img
        src={row.thumbnail}
        alt={row.title}
        className="w-16 h-16 object-cover rounded-lg bg-gray-200"
      />
    ),
  },
  {
    title: "Title",
    key: "title",
  },
  {
    title: "Release Date",
    key: "releaseDate",
    Element: ({ row }) => (
      <span>{new Date(row.releaseDate).toDateString()}</span>
    ),
  },
  // {
  //     title: "Status",
  //     key: "status",
  //     Element: ({ row }) => (
  //         <Badge
  //             className={row.status === EArtStatus.DRAFT ? 'bg-gray-200 text-gray-800' : 'bg-primary text-white'}
  //         >
  //             {row.status}
  //         </Badge>
  //     )
  // },
  {
    title: "Price",
    key: "price",
    Element: ({ row }) => <span>RWF {row.pricing.price}</span>,
  },
  {
    title: "Likes",
    key: "likes",
  },
  {
    title: "Streams",
    key: "streams",
  },
  {
    title: "Actions",
    key: "actions",
    Element: ({ row }) => (
      <Link href={`/dashboard/pre-releases/${row._id}`}>
        <Button variant={"outline"} className="border-primary">
          Go to song &rarr;
        </Button>
      </Link>
    ),
  },
];

export default function PreReleases() {
  const { loadingArts, arts } = useArtistArts();
  return (
    <>
      <Head>
        <title>{generatePageTitle("Your Pre-releases")}</title>
      </Head>
      <DashboardLayout>
        <main className="w-full px-2">
          <TableWrapper
            title="Pre-relseased Songs"
            description="Here are all the songs you have pre-released for sale"
            columns={columns}
            data={arts ?? []}
            emptyMessage="You have not uploaded any pre-released songs yet"
            loading={loadingArts}
            actions={
              <Link href="/dashboard/pre-releases/new">
                <Button>
                  <Plus />
                  <span className="pl-2">New Pre-release</span>
                </Button>
              </Link>
            }
          />
        </main>
      </DashboardLayout>
    </>
  );
}
