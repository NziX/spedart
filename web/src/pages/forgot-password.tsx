import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useAuth from "@/hooks/useAuth"
import { generatePageTitle } from "@/lib/utils"
import { Loader } from "lucide-react"
import Head from "next/head"
import { FormEvent } from "react"
import { useRecoilValue } from "recoil"
import { activeResetPasswordStepState } from "@/atoms"
import { notifications } from "@mantine/notifications"

export default function ForgotPassword() {
    const activeResetPasswordStep = useRecoilValue(activeResetPasswordStepState);

    return (
        <>
            <Head>
                <title>{generatePageTitle("Reset Password")}</title>
            </Head>
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2  ">
                <div className="flex items-center justify-center py-12">
                    {activeResetPasswordStep === "email" && <EnterEmail />}
                    {activeResetPasswordStep === "code" && <VerifyCode />}
                    {activeResetPasswordStep === "password" && <SetNewPassword />}
                </div>
                <div className="hidden bg-muted lg:block">
                    <Image
                        src="/security.jpg"
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



const EnterEmail = () => {
    const { sendResetCode, sendingResetCode } = useAuth();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = form.get("email") as string;
        sendResetCode(email);
    }

    return (
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2">
                <h1 className="text-3xl font-bold">Reset Passwrod</h1>
                <p className="text-muted-foreground">
                    Enter your email address to receive a reset code
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

                <Button
                    disabled={sendingResetCode}
                    type="submit" className="w-full min-w-44">
                    {sendingResetCode ? <Loader
                        color="white"
                        className="animate-spin"
                    /> : "Send Reset Code"}
                </Button>
            </form>
        </div>
    )
}


const VerifyCode = () => {
    const { verifyCode, verifyingCode } = useAuth();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const code = form.get("code") as string;
        verifyCode(code);
    }

    return (
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2">
                <h1 className="text-3xl font-bold">Verify Code</h1>
                <p className="text-muted-foreground">
                    Enter the code sent to your email address
                </p>
            </div>
            <form
                onSubmit={handleSubmit}
                className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="code">Code</Label>
                    <Input
                        id="code"
                        type="text"
                        name="code"
                        placeholder="123456"
                        required
                        maxLength={6}
                        minLength={6}
                    />
                </div>

                <Button
                    disabled={verifyingCode}
                    type="submit" className="w-full min-w-44">
                    {verifyingCode ? <Loader
                        color="white"
                        className="animate-spin"
                    /> : "Verify Code"}
                </Button>
            </form>
        </div>
    )
}

const SetNewPassword = () => {
    const { setNewPassword, settingNewPassword } = useAuth();

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const password = form.get("password") as string;
        const repeatPassword = form.get("repeat_password") as string;
        if (password !== repeatPassword) {
            notifications.show({
                message: 'Passwords do not match',
                color: 'red'
            });
            return;
        }
        setNewPassword(password);
    }

    return (
        <div className="mx-auto grid w-[350px] gap-6">
            <div className="grid gap-2">
                <h1 className="text-3xl font-bold">Set New Password</h1>
                <p className="text-muted-foreground">
                    Enter your new password
                </p>
            </div>
            <form
                onSubmit={handleSubmit}
                className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="********"
                        required
                        minLength={4}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Repeat Password</Label>
                    <Input
                        id="repeatPassword"
                        type="password"
                        name="repeat_password"
                        placeholder="********"
                        required
                        minLength={4}
                    />
                </div>

                <Button
                    disabled={settingNewPassword}
                    type="submit" className="w-full min-w-44">
                    {settingNewPassword ? <Loader
                        color="white"
                        className="animate-spin"
                    /> : "Set New Password"}
                </Button>
            </form>
        </div>
    )
}