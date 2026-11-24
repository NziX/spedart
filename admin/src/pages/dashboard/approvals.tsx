import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import Image from "next/image";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import TableWrapper from "@/components/tables/TableWrapper";
import { Column } from "@/components/tables/Table";
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
import { Label } from "@/components/ui/label";
import axios from "@/lib/axios.config";
import { Artist } from "@/types";
import { notifications } from "@mantine/notifications";
import { CheckCircle2, XCircle, Clock, AlertCircle, Trash2, AlertTriangle } from "lucide-react";

type ArtistStatus = "pending" | "approved" | "rejected";

export default function ArtistApprovals() {
  const [activeTab, setActiveTab] = useState<ArtistStatus>("pending");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [artistToDelete, setArtistToDelete] = useState<Artist | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { mutate: globalMutate } = useSWRConfig();

  const {
    data: artists,
    isLoading,
    mutate,
  } = useSWR(
    `/admin/artists?status=${activeTab}`,
    async (url: string) => {
      const { data } = await axios.get(url);
      return (data?.artists || []) as Artist[];
    }
  );

  const { data: pendingCountData, mutate: mutatePendingCount } = useSWR(
    "/admin/artists/pending-count",
    async (url: string) => {
      const { data } = await axios.get(url);
      return data?.count || 0;
    }
  );

  const handleApprove = async (artist: Artist) => {
    setActionLoadingId(artist._id);
    try {
      await axios.post(`/admin/artists/${artist._id}/approve`);
      notifications.show({
        title: "Artist Approved",
        message: `${artist.stageName || artist.firstName} has been approved and notified via email.`,
        color: "teal",
      });
      await mutate();
      mutatePendingCount();
      globalMutate("/admin/artists/pending-count");
    } catch (error: any) {
      notifications.show({
        title: "Action Failed",
        message: error?.response?.data?.message || "Failed to approve artist",
        color: "red",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDeleteModal = (artist: Artist) => {
    setArtistToDelete(artist);
    setDeleteModalOpen(true);
  };

  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;
    setIsDeleting(true);
    try {
      const { data } = await axios.delete(`/admin/artists/${artistToDelete._id}`);
      notifications.show({
        title: "Artist Deleted",
        message:
          data?.message ||
          `${artistToDelete.stageName || artistToDelete.firstName} and all their arts have been deleted.`,
        color: "teal",
      });
      setDeleteModalOpen(false);
      setArtistToDelete(null);
      await mutate();
      mutatePendingCount();
      globalMutate("/admin/artists/pending-count");
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

  const openRejectModal = (artist: Artist) => {
    setSelectedArtist(artist);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedArtist) return;
    setActionLoadingId(selectedArtist._id);
    try {
      await axios.post(`/admin/artists/${selectedArtist._id}/reject`, {
        reason: rejectionReason,
      });
      notifications.show({
        title: "Artist Rejected",
        message: `${selectedArtist.stageName || selectedArtist.firstName} has been rejected and notified via email.`,
        color: "red",
      });
      setRejectModalOpen(false);
      setSelectedArtist(null);
      await mutate();
      mutatePendingCount();
      globalMutate("/admin/artists/pending-count");
    } catch (error: any) {
      notifications.show({
        title: "Action Failed",
        message: error?.response?.data?.message || "Failed to reject artist",
        color: "red",
      });
    } finally {
      setActionLoadingId(null);
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
      title: "Contact & Email Verification",
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
                Email Unverified
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{row.phoneNumber}</p>
        </div>
      ),
    },
    {
      title: "Registered",
      key: "createdAt",
      Element: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.createdAt
            ? new Date(row.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      title: "Bio",
      key: "bio",
      Element: ({ row }) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-xs">
          {row.bio || "No bio provided"}
        </p>
      ),
    },
    {
      title: "Status",
      key: "status",
      Element: ({ row }) => {
        const status = row.status || "approved";
        if (status === "pending") {
          return (
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1 w-fit">
              <Clock className="w-3 h-3" /> Pending
            </Badge>
          );
        }
        if (status === "approved") {
          return (
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 w-fit">
              <CheckCircle2 className="w-3 h-3" /> Approved
            </Badge>
          );
        }
        return (
          <div className="space-y-1">
            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
              <XCircle className="w-3 h-3" /> Rejected
            </Badge>
            {row.rejectionReason && (
              <p className="text-[11px] text-muted-foreground max-w-xs italic line-clamp-2">
                &ldquo;{row.rejectionReason}&rdquo;
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: "Reviewed Details",
      key: "reviewedAt",
      Element: ({ row }) => {
        if (!row.reviewedAt) {
          return <span className="text-xs text-muted-foreground">Not reviewed</span>;
        }
        return (
          <div className="text-xs text-muted-foreground">
            <p>
              {new Date(row.reviewedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </p>
            {row.reviewedBy?.username && (
              <p className="text-[11px]">by {row.reviewedBy.username}</p>
            )}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      Element: ({ row }) => {
        const isCurrentLoading = actionLoadingId === row._id;
        const currentStatus = row.status || "approved";

        return (
          <div className="flex items-center gap-2">
            {currentStatus !== "approved" && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                disabled={isCurrentLoading}
                onClick={() => handleApprove(row)}
              >
                {isCurrentLoading ? "Saving..." : "Approve"}
              </Button>
            )}

            {currentStatus !== "rejected" && (
              <Button
                size="sm"
                variant="destructive"
                className="text-xs h-8 px-3"
                disabled={isCurrentLoading}
                onClick={() => openRejectModal(row)}
              >
                Reject
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              disabled={isCurrentLoading}
              onClick={() => openDeleteModal(row)}
              className="text-xs h-8 px-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Artist Approvals</h1>
            <p className="text-sm text-muted-foreground">
              Review and manage artist access to the platform
            </p>
          </div>

          <div className="flex items-center bg-muted p-1 rounded-lg border w-fit">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "pending"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Pending</span>
              {(pendingCountData ?? 0) > 0 && (
                <span className="bg-amber-500 text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCountData}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "approved"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "rejected"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Table */}
        <TableWrapper
          columns={columns}
          data={artists ?? []}
          loading={isLoading}
          emptyMessage={`No ${activeTab} artists found.`}
        />
      </div>

      {/* Rejection Dialog with Optional Reason */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" /> Reject Artist Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject{" "}
              <strong>
                {selectedArtist?.stageName || selectedArtist?.firstName}
              </strong>
              ? They will be blocked from accessing artist dashboard and will
              receive an email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-3">
            <Label htmlFor="rejectionReason" className="text-sm font-medium">
              Reason for Rejection (Optional)
            </Label>
            <textarea
              id="rejectionReason"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please provide a clear profile photo and valid portfolio link before reapplying."
              className="w-full text-sm rounded-md border border-input bg-transparent px-3 py-2 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={actionLoadingId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={actionLoadingId !== null}
            >
              {actionLoadingId ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          {artistToDelete && (
            <div className="space-y-4 py-2">
              <div className="bg-muted/50 p-3 rounded-lg border text-sm space-y-1">
                <p className="font-semibold text-foreground">
                  {artistToDelete.firstName} {artistToDelete.lastName}
                  {artistToDelete.stageName ? ` (${artistToDelete.stageName})` : ""}
                </p>
                <p className="text-xs text-muted-foreground">{artistToDelete.email}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Dashboard Funds:</span>
                  <span className={`text-xs font-bold ${(Number(artistToDelete.balance) || 0) > 0 ? "text-emerald-700" : "text-muted-foreground"}`}>
                    {(Number(artistToDelete.balance) || 0).toLocaleString()} RWF
                  </span>
                </div>
              </div>

              {/* CRITICAL FUNDS CHECK ALERT */}
              {(Number(artistToDelete.balance) || 0) > 0 || artistToDelete.pendingWithdrawal ? (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-3.5 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Deletion Blocked: Artist Has Active Funds</span>
                  </div>
                  <p>
                    This artist currently has <strong>{(Number(artistToDelete.balance) || 0).toLocaleString()} RWF</strong> in their dashboard balance
                    {artistToDelete.pendingWithdrawal ? " and a pending payout in progress" : ""}.
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
              disabled={
                isDeleting ||
                (Number(artistToDelete?.balance) || 0) > 0 ||
                !!artistToDelete?.pendingWithdrawal
              }
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
