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
import { CheckCircle2, XCircle, Clock, AlertCircle, Trash2, AlertTriangle, Eye, ShieldCheck, CreditCard, ExternalLink, Camera, UserCheck } from "lucide-react";

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

  const [idModalOpen, setIdModalOpen] = useState(false);
  const [selectedArtistForId, setSelectedArtistForId] = useState<Artist | null>(null);
  const [approveWarningModalOpen, setApproveWarningModalOpen] = useState(false);
  const [artistToApproveWithWarning, setArtistToApproveWithWarning] = useState<Artist | null>(null);

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

  const handleApproveInitiation = (artist: Artist) => {
    const hasFront = Boolean(artist.nationalId?.frontImage);
    const hasBack = Boolean(artist.nationalId?.backImage);
    const hasLiveFace = Boolean(artist.nationalId?.liveFacePhoto);
    if (!hasFront || !hasBack || !hasLiveFace) {
      setArtistToApproveWithWarning(artist);
      setApproveWarningModalOpen(true);
      return;
    }
    handleApprove(artist);
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
      title: "National ID & Face Verification",
      key: "nationalId",
      Element: ({ row }) => {
        const hasFront = Boolean(row.nationalId?.frontImage);
        const hasBack = Boolean(row.nationalId?.backImage);
        const hasLiveFace = Boolean(row.nationalId?.liveFacePhoto);
        const hasId = hasFront && hasBack;

        return (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {hasId ? (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> ID Scanned (Front &amp; Back)
                </Badge>
              ) : hasFront || hasBack ? (
                <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Incomplete ID Scans
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" /> No ID Uploaded
                </Badge>
              )}

              {hasLiveFace ? (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <Camera className="w-3 h-3 text-blue-600" /> Live Face Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] px-1.5 py-0 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" /> Live Face Missing
                </Badge>
              )}
            </div>

            {row.nationalId?.idNumber && (
              <p className="text-[11px] font-mono text-muted-foreground">
                No: {row.nationalId.idNumber}
              </p>
            )}

            {(hasFront || hasBack || hasLiveFace) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedArtistForId(row);
                  setIdModalOpen(true);
                }}
                className="h-6 text-[11px] px-2 gap-1 text-indigo-700 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
              >
                <Eye className="w-3 h-3" /> Inspect ID &amp; Face Verification
              </Button>
            ) : null}
          </div>
        );
      },
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
                onClick={() => handleApproveInitiation(row)}
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

      {/* National ID & Face Verification Inspection Dialog */}
      <Dialog open={idModalOpen} onOpenChange={setIdModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              National ID &amp; Live Face Verification Details
            </DialogTitle>
            <DialogDescription>
              Review the official ID scans and live webcam selfie to confirm that the person matches their document.
            </DialogDescription>
          </DialogHeader>

          {selectedArtistForId && (
            <div className="space-y-4 py-2">
              {/* Applicant Info Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3.5 rounded-lg border text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Full Legal Name</span>
                  <p className="font-semibold text-foreground text-sm">
                    {selectedArtistForId.firstName} {selectedArtistForId.lastName}
                  </p>
                  {selectedArtistForId.stageName && (
                    <p className="text-muted-foreground text-[11px]">
                      Stage: {selectedArtistForId.stageName}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Contact</span>
                  <p className="font-medium text-foreground">{selectedArtistForId.email}</p>
                  <p className="text-muted-foreground">{selectedArtistForId.phoneNumber}</p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">ID / Passport Number</span>
                  <p className="font-mono font-bold text-foreground text-sm text-indigo-700">
                    {selectedArtistForId.nationalId?.idNumber || "Not recorded"}
                  </p>
                  {selectedArtistForId.nationalId?.submittedAt && (
                    <p className="text-muted-foreground text-[10px]">
                      Submitted: {new Date(selectedArtistForId.nationalId.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Anti-Fraud Comparison Note */}
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3 flex items-start gap-2.5 text-indigo-950 text-xs">
                <UserCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Face-to-ID Authenticity Check</p>
                  <p className="text-indigo-800 text-[11px] mt-0.5">
                    Compare the portrait on the <strong>Front ID card</strong> with the <strong>Live Face Selfie</strong> to ensure the applicant is not an impersonator or scammer using someone else&apos;s stolen ID.
                  </p>
                </div>
              </div>

              {/* 3-Column Verification Grid: Front ID, Back ID, Live Face Capture */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Front Scan */}
                <div className="border rounded-xl p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      1. Front of ID
                    </span>
                    {selectedArtistForId.nationalId?.frontImage && (
                      <a
                        href={selectedArtistForId.nationalId.frontImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedArtistForId.nationalId?.frontImage ? (
                    <div className="rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center p-1 min-h-[160px]">
                      <img
                        src={selectedArtistForId.nationalId.frontImage}
                        alt="Front ID Scan"
                        className="w-full h-auto max-h-56 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4">
                      <AlertCircle className="w-5 h-5 mb-1 text-amber-500" />
                      Front scan not uploaded
                    </div>
                  )}
                </div>

                {/* 2. Back Scan */}
                <div className="border rounded-xl p-3 bg-card space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      2. Back of ID
                    </span>
                    {selectedArtistForId.nationalId?.backImage && (
                      <a
                        href={selectedArtistForId.nationalId.backImage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-primary hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedArtistForId.nationalId?.backImage ? (
                    <div className="rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center p-1 min-h-[160px]">
                      <img
                        src={selectedArtistForId.nationalId.backImage}
                        alt="Back ID Scan"
                        className="w-full h-auto max-h-56 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4">
                      <AlertCircle className="w-5 h-5 mb-1 text-amber-500" />
                      Back scan not uploaded
                    </div>
                  )}
                </div>

                {/* 3. Live Face Capture (FaceTime Selfie) */}
                <div className="border-2 border-blue-200 rounded-xl p-3 bg-blue-50/20 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
                    <span className="text-xs font-semibold flex items-center gap-1.5 text-blue-900">
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      3. Live Face Capture
                    </span>
                    {selectedArtistForId.nationalId?.liveFacePhoto && (
                      <a
                        href={selectedArtistForId.nationalId.liveFacePhoto}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {selectedArtistForId.nationalId?.liveFacePhoto ? (
                    <div className="rounded-lg overflow-hidden border bg-black/5 flex items-center justify-center p-1 min-h-[160px]">
                      <img
                        src={selectedArtistForId.nationalId.liveFacePhoto}
                        alt="Live Face Verification"
                        className="w-full h-auto max-h-56 object-contain rounded"
                      />
                    </div>
                  ) : (
                    <div className="h-40 rounded-lg border-2 border-dashed border-amber-300 flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-4 bg-amber-50/50">
                      <AlertCircle className="w-5 h-5 mb-1 text-amber-500" />
                      Live selfie not captured
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between items-center sm:justify-between w-full pt-2">
            <Button
              variant="outline"
              onClick={() => setIdModalOpen(false)}
            >
              Close
            </Button>

            {selectedArtistForId && selectedArtistForId.status !== "approved" && (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                disabled={actionLoadingId === selectedArtistForId._id}
                onClick={async () => {
                  setIdModalOpen(false);
                  await handleApprove(selectedArtistForId);
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm &amp; Approve Artist
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog: Approving Artist Without ID or Live Face */}
      <Dialog open={approveWarningModalOpen} onOpenChange={setApproveWarningModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Verification Incomplete
            </DialogTitle>
            <DialogDescription>
              Anti-scam verification warning before approval.
            </DialogDescription>
          </DialogHeader>

          {artistToApproveWithWarning && (
            <div className="space-y-3 py-2 text-xs">
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3.5 space-y-2">
                <p className="font-semibold text-amber-950">
                  {artistToApproveWithWarning.firstName} {artistToApproveWithWarning.lastName} has not submitted all required identity checks:
                </p>

                <ul className="space-y-1 pl-1">
                  {!artistToApproveWithWarning.nationalId?.frontImage && (
                    <li className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Missing Front of National ID scan
                    </li>
                  )}
                  {!artistToApproveWithWarning.nationalId?.backImage && (
                    <li className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Missing Back of National ID scan
                    </li>
                  )}
                  {!artistToApproveWithWarning.nationalId?.liveFacePhoto && (
                    <li className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      Missing Live Face Selfie verification
                    </li>
                  )}
                </ul>

                <p className="text-amber-800 font-medium pt-1">
                  Are you certain you want to bypass these verification requirements and approve this artist anyway?
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setApproveWarningModalOpen(false);
                setArtistToApproveWithWarning(null);
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={async () => {
                if (artistToApproveWithWarning) {
                  const target = artistToApproveWithWarning;
                  setApproveWarningModalOpen(false);
                  setArtistToApproveWithWarning(null);
                  await handleApprove(target);
                }
              }}
            >
              Approve Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
