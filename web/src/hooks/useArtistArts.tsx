/* eslint-disable react-hooks/exhaustive-deps */
import useSWR from 'swr';
import axios from '@/lib/axios.config';
import useAuth from './useAuth';
import { Art } from '@/types';
import { useEffect, createContext, useContext, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/router';

interface IUseArtistArts {
    arts?: Art[];
    loadingArts: boolean;
    createArt: (art: Partial<Art>) => Promise<void>;
    updateArt: (art: Art) => Promise<void>;
    updatingArt: boolean;
    creatingArt: boolean
}

// const ArtistArtsContext = createContext<IUseArtistArts>({} as IUseArtistArts);

export default function useArtistArts() {
    const router = useRouter();
    const { artist } = useAuth();
    const [creatingArt, setCreatingArt] = useState(false);
    const [updatingArt, setUpdatingArt] = useState(false);

    const { data: arts, error, mutate } = useSWR(`/arts/by-artist/${artist?._id}`, async (url) => {
        if (!artist) return [];
        const { data } = await axios.get(url);
        return data.arts as Art[];
    });

    useEffect(() => {
        mutate();
    }, [artist]);


    const createArt = async (art: Partial<Art>) => {
        setCreatingArt(true);
        try {
            await axios.post('/arts', {
                ...art,
                artist: artist?._id
            });
            notifications.show({
                title: 'Art created',
                message: 'Art has been successfully created',
                color: 'green',
            });
            mutate();
            router.push("/dashboard/pre-releases");
        } catch (error: any) {
            console.error(error);

            if (error.response?.status === 400) {
                notifications.show({
                    title: 'Validation error',
                    message: error.response.data.message,
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'An error occurred while creating art',
                    color: 'red',
                });
            }
        } finally {
            setCreatingArt(false);
        }
    }

    const updateArt = async (art: Art) => {
        setUpdatingArt(true);
        try {
            await axios.put(`/arts/${art._id}`, art);
            notifications.show({
                title: 'Art updated',
                message: 'Art has been successfully updated',
                color: 'green',
            });
            mutate();
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 400) {
                notifications.show({
                    title: 'Validation error',
                    message: error.response.data.message,
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'An error occurred while updating art',
                    color: 'red',
                });
            }
        } finally {
            setUpdatingArt(false);
        }
    }

    return {
        arts,
        loadingArts: !arts && !error,
        createArt,
        creatingArt,
        updateArt,
        updatingArt
    }
};
