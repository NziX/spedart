import { paymentState } from "@/atoms";
import { PaymentModal } from "@/components/artists/shared/PaymentModal";
import CustomerSignUpModal from "@/components/customer/signup";
import ExploreLayout from "@/components/layouts/ExploreLayout";
import Song from "@/components/Song";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import useAuth from "@/hooks/useAuth";
import axios from "@/lib/axios.config";
import { generatePageTitle } from "@/lib/utils";
import { useGetPreReleaseById } from "@/services/pre-releases";
import { notifications } from "@mantine/notifications";
import {
  AudioLines,
  Heart,
  Loader2,
  Pause,
  Play,
  ThumbsUp
} from "lucide-react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import LoadingView from "@/components/LoadingView";
import EmptyView from "@/components/EmptyView";

export default function PreReleaseView() {
  const router = useRouter();
  const { songId } = router.query;

  const {
    data,
    isLoading: fetchingPreRelease,
    isError
  } = useGetPreReleaseById(songId?.toString() ?? "");


  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useRecoilState(paymentState);
  const [liked, setLiked] = useState<boolean>(false);
  const { customer, refetchCustomer } = useAuth();
  const [progress, setProgress] = useState(0);
  const progressIntervalRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("streamToken")) {
      setPayment("SUCCESSFUL");
    }
  }, [setPayment]);

  const fetchAndDecryptStream = useCallback(async (url: string) => {
    const userToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {};
    if (userToken) {
      headers["Authorization"] = `Bearer ${userToken}`;
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers,
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch the encrypted stream");
    }

    const ivHex = response.headers["x-init-vector"];
    const keyHex = response.headers["x-encryption-key"];

    if (!ivHex || !keyHex) {
      throw new Error(
        "Initialization vector or encryption key not found in response headers",
      );
    }

    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)),
    );
    const key = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map((byte: string) => parseInt(byte, 16)),
    );
    const encryptedData = new Uint8Array(response.data);

    const importedKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC" },
      false,
      ["decrypt"],
    );
    const decryptedData = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      importedKey,
      encryptedData,
    );

    return decryptedData;
  }, []);

  const fetchAndDecodeAudio = useCallback(async () => {
    if (audioBuffer) return; // Prevent re-fetching if we already have the audio buffer

    setIsLoading(true);
    setError(null);
    try {
      const decryptedData = await fetchAndDecryptStream(
        `/arts/stream-art/${data?.art._id}?streamToken=${localStorage.getItem(
          "streamToken",
        )}`,
      );

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      const buffer =
        await audioContextRef.current.decodeAudioData(decryptedData);
      setAudioBuffer(buffer);
    } catch (error) {
      console.error("Failed to fetch and decrypt stream:", error);
      setError("Failed to load audio. Please try again.");
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.art._id, audioBuffer]);

  useEffect(() => {
    if (payment === "SUCCESSFUL") {
      fetchAndDecodeAudio();
    }
  }, [payment, fetchAndDecodeAudio]);

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (progressIntervalRef.current) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  const startPlayback = useCallback(
    (startFrom: number = pausedAtRef.current) => {
      if (!audioContextRef.current || !audioBuffer) return;

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      startTimeRef.current = audioContextRef.current.currentTime;
      pausedAtRef.current = startFrom;
      source.start(0, startFrom);
      sourceNodeRef.current = source;

      source.onended = () => {
        if (sourceNodeRef.current === source) {
          stopPlayback();
          setIsPlaying(false);
          pausedAtRef.current = 0;
          setProgress(0);
        }
      };
    },
    [audioBuffer, stopPlayback],
  );

  const updateProgress = useCallback(() => {
    if (!audioContextRef.current || !audioBuffer || isDraggingRef.current)
      return;

    const elapsed = pausedAtRef.current;
    const duration = audioBuffer.duration;
    const currentProgress = (elapsed / duration) * 100;
    setProgress(Math.min(currentProgress, 100));
  }, [audioBuffer]);

  const startProgressTracking = useCallback(() => {
    if (!audioContextRef.current || !audioBuffer) return;

    progressIntervalRef.current = window.setInterval(() => {
      if (isDraggingRef.current) return;

      const elapsed =
        pausedAtRef.current +
        (audioContextRef.current!.currentTime - startTimeRef.current);
      const duration = audioBuffer.duration;
      const currentProgress = (elapsed / duration) * 100;

      if (currentProgress >= 100) {
        stopPlayback();
        setIsPlaying(false);
        pausedAtRef.current = 0;
        setProgress(0);
        return;
      }

      setProgress(Math.min(currentProgress, 100));
    }, 50);
  }, [audioBuffer, stopPlayback]);

  const handleSeek = useCallback(
    (value: number) => {
      if (!audioBuffer) return;

      const newTime = (value / 100) * audioBuffer.duration;
      pausedAtRef.current = newTime;

      if (isPlaying) {
        stopPlayback();
        startPlayback(newTime);
        startProgressTracking();
      } else {
        updateProgress();
      }
    },
    [
      audioBuffer,
      isPlaying,
      stopPlayback,
      startPlayback,
      startProgressTracking,
      updateProgress,
    ],
  );

  const togglePlayPause = useCallback(() => {
    if (!audioContextRef.current || !audioBuffer) return;

    if (isPlaying) {
      stopPlayback();
      pausedAtRef.current =
        pausedAtRef.current +
        (audioContextRef.current.currentTime - startTimeRef.current);
      updateProgress();
      setIsPlaying(false);
    } else {
      startPlayback();
      startProgressTracking();
      setIsPlaying(true);
    }
  }, [
    isPlaying,
    audioBuffer,
    stopPlayback,
    startPlayback,
    startProgressTracking,
    updateProgress,
  ]);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopPlayback]);

  const likeArt = async (phoneNumber?: String) => {
    if (phoneNumber) {
      try {
        await axios.put(`/arts/like-art/${data?.art._id}?phoneNumber=${phoneNumber}`);
        refetchCustomer();
        notifications.show({
          title: "Art liked",
          message: "Art liked successfully",
          color: "green",
        });
        setLiked(true);
        return;
      } catch (error) {
        console.error("Failed to like art:", error);
        return;
      }
    }

    try {
      await axios.put(
        `/arts/like-art/${data?.art._id}?phoneNumber=${customer?.phoneNumber}`,
      );
      setLiked(true);
      refetchCustomer();
      notifications.show({
        title: "Art liked",
        message: "Art liked successfully",
        color: "green",
      });
      return;
    } catch (error) {
      console.error("Failed to like art:", error);
      return;
    }
  };

  const unlikeArt = async (phoneNumber?: string) => {
    if (phoneNumber) {
      try {
        await axios.put(
          `/arts/unlike-art/${data?.art._id}?phoneNumber=${phoneNumber}`,
        );
        refetchCustomer();
        notifications.show({
          title: "Art unliked",
          message: "Art unliked successfully",
          color: "green",
        });
        setLiked(false);
        return;
      } catch (error) {
        console.error("Failed to unlike art:", error);
        return;
      }
    }

    try {
      await axios.put(
        `/arts/unlike-art/${data?.art._id}?phoneNumber=${customer?.phoneNumber}`,
      );
      setLiked(false);
      refetchCustomer();
      notifications.show({
        title: "Art unliked",
        message: "Art unliked successfully",
        color: "green",
      });
      return;
    } catch (error) {
      console.error("Failed to unlike art:", error);
      return;
    }
  };

  return (
    <>
      <Head>
        <title>{generatePageTitle("Pre-release")}</title>
      </Head>
      <ExploreLayout>
        {
          fetchingPreRelease ? (
            <LoadingView
              message="Loading Pre-Release ..."
            />
          ) : isError ? (
            <EmptyView message="Can't find the song you are looking for. Please Check the URL and try again!" />
          ) : !data?.art ? (
            <EmptyView message="Can't find the song you are looking for. Please Check the URL and try again!" />
          ) :
            < main className="px-4 md:px-6 space-y-16 py-12 min-h-[75vh]">
              <div className="space-y-10">
                <div className="flex justify-between pb-3 border-b">
                  <div className="flex items-center gap-x-3">
                    <div className="relative w-[60px] h-[60px]">
                      <Image
                        src={data.art.artist.profilePicture}
                        fill
                        className="rounded-full object-cover w-full h-full"
                        alt={data.artist.stageName}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">{`${data.artist.stageName}`}</p>
                      <p className="text-sm">
                        {data.pre_releases?.length?.toLocaleString()} song
                        {data.pre_releases?.length > 1 && "s"}{" "}
                      </p>
                    </div>
                  </div>
                  <Link href={`/artists/${data.art.artist._id}`}>
                    <Button>Support &rarr;</Button>
                  </Link>
                </div>

                {/* song */}
                <div className="flex flex-col sm:flex-row justify-between w-full gap-y-4 sm:gap-x-12">
                  <div className="relative w-full h-[600px]">
                    <Image
                      src={data.art.thumbnail}
                      fill
                      className="rounded-xl object-cover"
                      alt=""
                    />
                  </div>
                  <div className="space-y-5 w-full sm:w-2/3 py-4">
                    <div className="w-full flex justify-between">
                      <h3 className="text-xl font-semibold">{data.art.title}</h3>
                      {customer ? (
                        <Button
                          className="rounded-full w-fit h-fit p-2"
                          variant={"outline"}
                          onClick={() =>
                            liked || customer?.likedArt?.includes(data.art?._id)
                              ? unlikeArt()
                              : likeArt()
                          }
                        >
                          <Heart
                            size={20}
                            className={
                              liked || customer?.likedArt?.includes(data.art?._id)
                                ? "fill-red-600"
                                : "fill-white"
                            }
                          />
                        </Button>
                      ) : (
                        <CustomerSignUpModal
                          trigger={
                            <Button
                              className="rounded-full w-fit h-fit p-2"
                              variant={"outline"}
                            >
                              <Heart size={20} />
                            </Button>
                          }
                          onSignUp={(signupData) => {
                            if (signupData?.likedArt?.includes(data.art._id)) {
                              return unlikeArt(signupData.phoneNumber);
                            } else {
                              return likeArt(signupData.phoneNumber);
                            }
                          }}
                        />
                      )}
                    </div>
                    <p className="text-gray-600">
                      {data.art.description ?? "No description"}
                    </p>
                    <div className="flex w-full justify-between space-x-4 text-gray-700">
                      <div className="flex items-center gap-x-2">
                        <Button
                          variant={"outline"}
                          onClick={togglePlayPause}
                          className="flex items-center gap-x-2"
                          disabled={isLoading || payment !== "SUCCESSFUL"}
                        >
                          {!isLoading && !isPlaying && <Play />}
                          {isPlaying && <Pause />}
                          {isLoading && <Loader2 className="animate-spin" />}
                          {error && <p className="text-red-500 text-xs">{error}</p>}
                        </Button>
                      </div>
                      {!isLoading && payment === "SUCCESSFUL" && (
                        <div className="w-full flex items-center">
                          <Slider
                            step={0.1}
                            max={100}
                            defaultValue={[0]}
                            value={[progress]}
                            onValueChange={(values) => {
                              isDraggingRef.current = true;
                              setProgress(values[0]);
                            }}
                            onValueCommit={(values) => {
                              isDraggingRef.current = false;
                              handleSeek(values[0]);
                            }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-x-3 text-sm">
                        <div className="flex items-center gap-x-1">
                          <ThumbsUp size={12} />
                          <p>{data.art.likes}</p>
                        </div>
                        <div className="flex items-center gap-x-1">
                          <AudioLines size={12} />
                          <p>{data.art.streams}</p>
                        </div>
                      </div>
                    </div>
                    {payment !== "SUCCESSFUL" && (
                      <PaymentModal
                        trigger={
                          <Button
                            variant={"outline"}
                            className="w-full hover:bg-primary hover:text-white transition-colors duration-200"
                          >
                            Pay {data.art?.pricing?.price ?? 0}{" "}
                            {data.art?.pricing?.currency ?? "RWF"} to listen
                          </Button>
                        }
                        source="purchase"
                        title="Pay to listen"
                        description="A small fee to listen to this song"
                        amount={data.art?.pricing?.price ?? 0}
                        artist={data.art.artist}
                        art={data.art}
                      />
                    )}
                  </div>
                </div>
              </div>
              {data.pre_releases.filter((song) => song._id !== data.art._id).length > 0 && (
                <div className="space-y-6">
                  <p className="text-xl font-semibold text-gray-700">
                    Explore More Pre-Released Tracks by {`${data.art.artist.stageName}`}!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {data.pre_releases
                      .filter((song) => song._id !== data.art._id)
                      .map((preRelease) => (
                        <Song key={preRelease._id} {...preRelease} />
                      ))}
                  </div>
                </div>
              )}
            </main>
        }
      </ExploreLayout >
    </>
  );
}
