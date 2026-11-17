import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useAuth from "@/hooks/useAuth"
import { generatePageTitle } from "@/lib/utils"
import { Loader } from "lucide-react"
import Head from "next/head"
import { FormEvent } from "react"
import Logo from "@/components/Logo"

export default function Login() {
    const { login, loggingIn } = useAuth();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get("email") as string;
        const password = form.get("password") as string;
        login(email, password);
    }

    return (
        <>
            <Head>
                <title>{generatePageTitle("Login to your account")}</title>
            </Head>
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2  ">
                <div className="flex items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6">
                        <div className="flex w-full justify-center">
                            <Logo link />
                        </div>

                        <div className="grid gap-2 text-center">
                            <h1 className="text-3xl font-bold">Login</h1>
                            <p className="text-balance text-muted-foreground">
                                Enter your email below to login to your artist account
                            </p>
                        </div>
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="m@example.com"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    <Link
                                        href="/forgot-password"
                                        className="ml-auto inline-block text-sm underline"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <Input
                                    name="password"
                                    id="password" type="password" required />
                            </div>
                            <Button
                                disabled={loggingIn}
                                type="submit" className="w-full min-w-44">
                                {loggingIn ? <Loader
                                    color="white"
                                    className="animate-spin"
                                /> : "Login"}
                            </Button>
                        </form>
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account?{" "}
                            <Link href="/onboarding" className="underline">
                                create artist profile
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="hidden bg-muted lg:block">
                    <Image
                        src="/login-artist.jpg"
                        alt="Image"
                        width="1920"
                        height="1080"
                        className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                    />
                </div>
            </div>
        </>

    )
}
