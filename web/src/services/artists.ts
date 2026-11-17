import { useQuery } from "@tanstack/react-query";
import { IArtistWithArtCount, Art, IArtist } from "@/types";
import axios from "@/lib/axios.config";
import { AxiosError } from "axios";

export function useGetAllArtists() {
    return useQuery<IArtistWithArtCount[], AxiosError>({
        queryKey: ['artists'],
        queryFn: async () => {
            const { data } = await axios.get("/artists");
            return data.artists;
        }
    });
}

export function useGetArtistById(artistId: string) {
    return useQuery<{
        artist: IArtist;
        arts: Art[];
    }, AxiosError>({
        queryKey: ['artist', artistId],
        queryFn: async () => {
            const { data } = await axios.get(`/artists/${artistId}`);
            return data;
        }
    });
}