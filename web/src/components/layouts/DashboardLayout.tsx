import useAuth from "@/hooks/useAuth";
import DashboardNavbar from "../dashboard/DashboardNavbar";
// import { ArtistArtsProvider } from "@/hooks/useArtistArts";
import { ArtistPaymentsProvider } from "@/hooks/useArtistPayments";
import ShareSongModal from "../modals/ShareSongModal";
import ShareProfileModal from "../modals/ShareProfileModal";
import AritstBalanceModal from "../modals/ArtistBalanceModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { artist } = useAuth();
  return (
    <>
      {artist && (
        <ArtistPaymentsProvider>
          {/* <ArtistArtsProvider> */}
          <div className="flex min-h-screen w-full flex-col">
            <DashboardNavbar />
            <ShareSongModal />
            <ShareProfileModal />
            <AritstBalanceModal />
            <div className="max-w-[90rem] mx-auto w-full ">{children}</div>
          </div>
          {/* </ArtistArtsProvider> */}
        </ArtistPaymentsProvider>
      )}
    </>
  );
}
