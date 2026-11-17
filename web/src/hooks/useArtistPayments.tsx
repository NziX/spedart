/* eslint-disable react-hooks/exhaustive-deps */
import useSWR from "swr";
import axios from "@/lib/axios.config";
import { Payment } from "@/types";
import { useEffect, useContext, createContext } from "react";
import useAuth from "./useAuth";

interface IUseArtistPayments {
	payments?: Payment[];
	loadingPayments: boolean;
}

export const ArtistPaymentsContext = createContext<IUseArtistPayments>({
	payments: [],
	loadingPayments: false,
});

export function ArtistPaymentsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { artist } = useAuth();
	const { data, error, mutate, isLoading } = useSWR(
		"/supports/by-artist/" + artist?._id,
		async (url) => {
			if (!artist) return [];
			const { data } = await axios.get(url);
			return data?.payments as Payment[];
		}
	);

	useEffect(() => {
		mutate();
	}, [artist]);

	return (
		<ArtistPaymentsContext.Provider
			value={{ payments: data, loadingPayments: isLoading }}
		>
			{children}
		</ArtistPaymentsContext.Provider>
	);
}

export default function useArtistPayments() {
	const context = useContext(ArtistPaymentsContext);
	if (!context) {
		throw new Error(
			"useArtistPayments must be used within an ArtistPaymentsProvider"
		);
	}
	return context;
}
