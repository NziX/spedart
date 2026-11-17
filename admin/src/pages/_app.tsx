import { generatePageTittle } from "@/lib/utils";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "@/hooks/useAuth";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<>
			<Head>
				<title>{generatePageTittle("Admin dashboard")}</title>
			</Head>
			<MantineProvider>
				<Notifications />
				<AuthProvider>
					<Component {...pageProps} />
				</AuthProvider>
			</MantineProvider>
		</>
	);
}
