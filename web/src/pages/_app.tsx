import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Poppins } from "next/font/google";
import { RecoilRoot } from "recoil";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { Notifications } from "@mantine/notifications";
import { AuthProvider } from "@/hooks/useAuth";
import {
  QueryClientProvider,
  QueryClient
} from "@tanstack/react-query";
import Head from "next/head";


const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="/logo.png" />
      </Head>
      <QueryClientProvider client={queryClient}>
        <MantineProvider>
          <Notifications />
          <RecoilRoot>
            <AuthProvider>
              <div className={poppins.className}>
                <Component {...pageProps} />
              </div>
            </AuthProvider>
          </RecoilRoot>
        </MantineProvider >
      </QueryClientProvider>
    </>
  )

}
