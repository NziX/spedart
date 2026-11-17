import axios from "@/lib/axios.config";
import { useQuery } from "@tanstack/react-query";
import { Art, IArtist } from "@/types";
import { AxiosError } from "axios";

export function useGetPreReleases() {
    return useQuery<Art[], AxiosError>({
        queryKey: ['pre-releases'],
        queryFn: async () => {
            const { data } = await axios.get("/arts/pre-releases");
            return data.arts;
        },
    });
}


export function useGetPreReleaseById(songId: string) {
    return useQuery<{
        artist: IArtist;
        art: Art;
        pre_releases: Art[];
    }, AxiosError>({
        queryKey: ['pre-release', songId],
        queryFn: async () => {
            const { data: art_data } = await axios.get(`/arts/by-art/${songId}`);
            const { data: pre_releases_data } = await axios.get(
                `/arts/by-artist/${art_data?.art?.artist?._id}`,
            );

            return {
                artist: art_data?.art?.artist,
                art: art_data?.art,
                pre_releases: pre_releases_data?.arts,
            }
        },
    });
}