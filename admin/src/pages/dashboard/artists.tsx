import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Column } from "@/components/tables/Table";
import TableWrapper from "@/components/tables/TableWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "@/lib/axios.config";
import { Artist } from "@/types";
import { notifications } from "@mantine/notifications";
import Image from "next/image";
import useSWR from "swr";
import {
  Trash2,
  AlertTriangle,
  AlertCircle,
  Coins,
  Ban,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

export default function Artists() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const {
    data: artists,
    mutate,
    isLoading: loadingArtists,
  } = useSWR("/admin/artists?status=all", async (url) => {
    try {
      const { data } = await axios.get(url);
      return data?.artists as Artist[];
    } catch (e) {
      // Fallback to /artists if /admin/artists fails
      const { data } = await axios.get("/artists");
      return data?.artists as Artist[];
    }
  });

  const blockArtist = async (artist: Artist) => {
    setActionLoadingId(artist._id);
    try {
      await axios.put(`/admin/block-artist/${artist._id}`);
      notifications.show({
        message: `${artist.stageName || artist.firstName} has been blocked.`,
        color: "teal",
      });
      await mutate();
    } catch (error: any) {
      notifications.show({
        message: error?.response?.data?.message || "Failed to block artist",
        color: "red",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const unblockArtist = async (artist: Artist) => {
    setActionLoadingId(artist._id);
    try {
      await axios.put(`/admin/unblock-artist/${artist._id}`);
      notifications.show({
        message: `${artist.stageName || artist.firstName} has been unblocked.`,
        color: "teal",
      });
      await mutate();
    } catch (error: any) {
      notifications.show({
        message: error?.response?.data?.message || "Failed to unblock artist",
        color: "red",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDeleteModal = (artist: Artist) => {
    setSelectedArtist(artist);
    setDeleteModalOpen(true);
  };

  const handleDeleteArtist = async () => {
    if (!selectedArtist) return;
    setIsDeleting(true);
    try {
      const { data } = await axios.delete(`/admin/artists/${selectedArtist._id}`);
      notifications.show({
        title: "Artist Deleted",
        message:
          data?.message ||
          `${selectedArtist.stageName || selectedArtist.firstName} and all their arts have been deleted.`,
        color: "teal",
      });
      setDeleteModalOpen(false);
      setSelectedArtist(null);
      await mutate();
    } catch (error: any) {
      notifications.show({
        title: "Deletion Prevented",
        message:
          error?.response?.data?.message ||
          "Could not delete artist. Please ensure all dashboard funds are settled.",
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Artist>[] = [
    {
      title: "Artist",
      key: "firstName",
      Element: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.profilePicture ? (
            <Image
              src={row.profilePicture}
              alt={row.firstName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10 border"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground border">
              {(row.firstName?.[0] || "A").toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium leading-none">
              {row.firstName} {row.lastName}
            </p>
            {row.stageName && (
              <p className="text-xs text-muted-foreground mt-1">
                Stage: {row.stageName}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "email",
      Element: ({ row }) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium">{row.email}</span>
            {row.isEmailVerified ? (
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] px-1.5 py-0">
                Email ✓
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-amber-800 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0"
              >
                Unverified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{row.phoneNumber}</p>
        </div>
      ),
    },
    {
      title: "Dashboard Funds",
      key: "balance",
      Element: ({ row }) => {
        const balance = Number(row.balance) || 0;
        const hasFunds = balance > 0;
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Coins className={`w-3.5 h-3.5 ${hasFunds ? "text-emerald-600" : "text-muted-foreground"}`} />
              <span className={`text-sm font-semibold ${hasFunds ? "text-emerald-700" : "text-muted-foreground"}`}>
                {balance.toLocaleString()} RWF
              </span>
            </div>
            {hasFunds && (
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] px-1.5 py-0">
                Active Balance
              </Badge>
            )}
            {row.pendingWithdrawal && (
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] px-1.5 py-0">
                Payout Pending
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      Element: ({ row }) => {
        const status = row.status || "approved";
        if (status === "pending") {
          return (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 w-fit text-xs">
              <Clock className="w-3 h-3" /> Pending
            </Badge>
          );
        }
        if (status === "approved") {
          return (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 w-fit text-xs">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </Badge>
          );
        }
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit text-xs">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      },
    },
    {
      title: "Access",
      key: "isBlocked",
      Element: ({ row }) => (
        <Badge variant={row.isBlocked ? "destructive" : "secondary"} className="text-xs">
          {row.isBlocked ? "Blocked" : "Active"}
        </Badge>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      Element: ({ row }) => {
        const isLoading = actionLoadingId === row._id;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => (row.isBlocked ? unblockArtist(row) : blockArtist(row))}
              className={`text-xs h-8 px-2.5 ${
                row.isBlocked
                  ? "text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  : "text-amber-700 border-amber-300 hover:bg-amber-50"
              }`}
            >
              {isLoading ? "..." : row.isBlocked ? "Unblock" : "Block"}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => openDeleteModal(row)}
              className="text-xs h-8 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
              title="Delete artist and cascade delete arts"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const selectedBalance = Number(selectedArtist?.balance) || 0;
  const selectedHasFunds = selectedBalance > 0 || !!selectedArtist?.pendingWithdrawal;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Artists Management</h1>
          <p className="text-sm text-muted-foreground">
            View, block, and manage all artists on the platform
          </p>
        </div>

        <TableWrapper
          columns={columns}
          data={artists ?? []}
          loading={loadingArtists}
          emptyMessage="No artists found on the platform."
        />
      </div>

      {/* Delete Artist Confirmation Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" /> Delete Artist Account
            </DialogTitle>
            <DialogDescription>
              This action operates directly on the database.
            </DialogDescription>
          </DialogHeader>

          {selectedArtist && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-3 rounded-lg border text-sm space-y-1">
                <p className="font-semibold text-foreground">
                  {selectedArtist.firstName} {selectedArtist.lastName}
                  {selectedArtist.stageName ? ` (${selectedArtist.stageName})` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{selectedArtist.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Dashboard Funds:</span>
                  <span className={`text-xs font-bold ${selectedBalance > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                    {selectedBalance.toLocaleString()} RWF
                  </span>
                </div>
              </div>

              {/* CRITICAL FUNDS CHECK ALERT */}
              {selectedHasFunds ? (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Deletion Blocked: Artist Has Active Funds</span>
                  </div>
                  <p>
                    This artist currently has <strong>{selectedBalance.toLocaleString()} RWF</strong> in their dashboard balance
                    {selectedArtist.pendingWithdrawal ? " and a pending payout in progress" : ""}.
                  </p>
                  <p className="text-amber-800 font-medium">
                    As a financial security rule, artist accounts with unpaid or pending funds cannot be deleted. Outstanding funds must be withdrawn or settled before this account can be removed.
                  </p>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Permanent Cascading Deletion</span>
                  </div>
                  <p>
                    Deleting this artist will automatically:
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>Permanently delete their account from the database</li>
                    <li><strong>Automatically delete all their uploaded arts/songs</strong></li>
                    <li>Delete all associated plays and likes</li>
                    <li><strong>Immediately revoke all dashboard and login access</strong></li>
                  </ul>
                  <p className="pt-1 font-semibold text-[11px]">
                    This action is immediate and cannot be undone.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isDeleting || selectedHasFunds}
              onClick={handleDeleteArtist}
              className="gap-1.5"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
