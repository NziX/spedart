/* eslint-disable @next/next/no-img-element */
import EmptyView from "@/components/EmptyView";
import ExploreLayout from "@/components/layouts/ExploreLayout";
import LoadingView from "@/components/LoadingView";
import { Card } from "@/components/ui/card";
import { generatePageTitle } from "@/lib/utils";
import { useGetAllArtists } from "@/services/artists";
import { IArtistWithArtCount } from "@/types";
import { Music, Verified } from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { IoPerson } from "react-icons/io5";

export default function Artists() {

  const {
    data: artists,
    isLoading: fetchingArtists,
    isError
  } = useGetAllArtists();

  return (
    <>
      <Head>
        <title>{generatePageTitle("Explore Artists")}</title>
      </Head>
      <ExploreLayout>
        <main className="w-full min-h-[70vh] my-12 px-6">
          {
            fetchingArtists ? (
              <LoadingView
                message="Loading Artists ..."
              />
            ) : isError ? (
              <EmptyView message="An error occurred. Please try again later" />
            ) :
              (artists && artists?.length === 0) ? (
                <EmptyView message="No Artists on the platform At The Moment" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {artists?.map((artist, idx) => (
                    <Artist key={idx} {...artist} />
                  ))}
                </div>
              )}
        </main>
      </ExploreLayout>
    </>
  );
}

const Artist = ({
  stageName,
  profilePicture,
  _id,
  verified,
  artCount,
}: IArtistWithArtCount) => {
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/artists/${_id}`)}
      role="button"
      className="relative flex flex-col rounded-xl hover:border-primary overflow-hidden h-[400px]"
    >
      <div className="relative w-full h-[300px]">
        {profilePicture ? (
          <Image
            src={profilePicture}
            className="object-cover"
            alt={stageName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <IoPerson className="text-4xl text-gray-600" />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between p-4 flex-1">
        <div className="flex justify-between items-start gap-x-3">
          <h4 className="text-lg font-semibold line-clamp-2">{stageName}</h4>
          {verified && (
            <div className="flex items-center gap-x-1 flex-shrink-0">
              <Verified size={14} className="text-primary" />
              <p className="text-primary text-sm">verified</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-x-2 mt-2">
          <Music size={14} />
          <p className="text-sm">{artCount} songs</p>
        </div>
      </div>
    </Card>
  );
};
