/* eslint-disable @next/next/no-img-element */
import Logo from "@/components/Logo";
import { generatePageTitle } from "@/lib/utils";
import Head from "next/head";
import Link from "next/link";

export default function ErrorPage({ statusCode }: { statusCode: number }) {
    return (
        <>
            <Head>
                <title>{generatePageTitle(
                    statusCode === 404 ? "Page not found" : "An error occurred"
                )}</title>
            </Head>
            <div className="grid min-h-screen grid-cols-1 grid-rows-[1fr,auto,1fr] bg-white lg:grid-cols-[max(50%,36rem),1fr]">
                <header className="mx-auto w-full max-w-7xl px-6 pt-6 sm:pt-10 lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:px-8">
                    <Logo link/>
                </header>
                <main className="mx-auto w-full max-w-7xl px-6 py-24 sm:py-32 lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:px-8">
                    <div className="max-w-lg">
                        <p className="text-base font-semibold leading-8 text-primary">{statusCode}</p>
                        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">{
                            statusCode === 404 ? "Page not found" :
                                "An error occurred"
                        }</h1>
                        <p className="mt-6 text-base leading-7 text-gray-600">
                            {
                                statusCode === 404 ? "Sorry, we couldn’t find the page you’re looking for." :
                                    "Sorry, an error has occurred.Try refreshing the page or check back later."
                            }
                        </p>
                        <div className="mt-10">
                            <Link href="/" className="text-sm font-semibold leading-7 text-primary">
                                <span aria-hidden="true">&larr;</span> Back to home
                            </Link>
                        </div>
                    </div>
                </main>
                <footer className="self-end lg:col-span-2 lg:col-start-1 lg:row-start-3">
                    <div className="border-t border-gray-100 bg-gray-50 py-10">
                        <nav className="mx-auto flex w-full max-w-7xl items-center gap-x-4 px-6 text-sm leading-7 text-gray-600 lg:px-8">
                            <Link href="/contact">Contact support</Link>
                            <svg viewBox="0 0 2 2" aria-hidden="true" className="h-0.5 w-0.5 fill-gray-300">
                                <circle r={1} cx={1} cy={1} />
                            </svg>
                            {/* <a href="#">Status</a> */}
                        </nav>
                    </div>
                </footer>
                <div className="hidden lg:relative lg:col-start-2 lg:row-start-1 lg:row-end-4 lg:block">
                    <img
                        alt=""
                        src="https://images.unsplash.com/photo-1500211288281-b489ebb1fe01?q=80&w=3072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                </div>
            </div>
        </>
    )
}


// @ts-ignore
ErrorPage.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404
    return { statusCode }
}
