import PayArtistModal from "@/components/admin/pay";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import { Badge } from "@/components/ui/badge";
import axios from "@/lib/axios.config";
import { Artist } from "@/types";
import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import useSWR from "swr";

export default function Artists() {
  const {
    data: artists,
    error,
    mutate,
    isLoading: loadingArtists,
  } = useSWR("/artists", async (url) => {
    const { data } = await axios.get(url);
    return data?.artists;
  });

  const columns: Column<Artist>[] = [
    {
      title: "First Name",
      key: "firstName",
    },
    {
      title: "Last Name",
      key: "lastName",
    },
    {
      title: "Email",
      key: "email",
    },
    {
      title: "Phone Number",
      key: "phoneNumber",
    },
    {
      title: "Blocked",
      key: "isBlocked",
      Element: ({ row }) => (
        <Badge variant={row.isBlocked ? "destructive" : "default"}>
          {row.isBlocked ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      title: "Profile Image",
      key: "profilePicture",
      Element: ({ row }) => (
        <Image
          src={row.profilePicture}
          width={50}
          height={50}
          alt={row.firstName + " " + row.lastName}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      Element: ({ row }) => {
        const blockArtist = async () => {
          try {
            await axios.put(`/admin/block-artist/${row._id}`).then((res) => {
              notifications.show({
                message: "Artist blocked successfully",
                color: "green",
              });
              mutate();
            });
          } catch (error) {
            console.log(error);
            notifications.show({
              message: "An error occurred",
              color: "red",
            });
          }
        };

        const unblockArtist = async () => {
          try {
            await axios.put(`/admin/unblock-artist/${row._id}`).then((res) => {
              notifications.show({
                message: "Artist unblocked successfully",
                color: "green",
              });
              mutate();
            });
          } catch (error) {
            console.log(error);
            notifications.show({
              message: "An error occurred",
              color: "red",
            });
          }
        };

        return (
          <div className="flex gap-x-3">
            <Button
              variant="outline"
              color={row.isBlocked ? "teal" : "red"}
              onClick={() => (row.isBlocked ? unblockArtist() : blockArtist())}
            >
              {row.isBlocked ? "Unblock" : "Block"}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <TableWrapper
        title="Artists"
        description="List of all artists on the platform"
        columns={columns}
        data={artists}
        // actions={<Button>Add Artist</Button>}
        loading={loadingArtists}
      />
    </DashboardLayout>
  );
}
