import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuth from "@/hooks/useAuth";
import { loginSchema } from "@/types/auth";
import { notifications } from "@mantine/notifications";
import { FormEvent, useState } from "react";

export default function Login() {
	const { login, loggingIn } = useAuth();

	const [email, setEmail] = useState<string>();
	const [password, setPassword] = useState<string>();

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const validateFields = loginSchema.safeParse({ email, password });

		if (!validateFields) {
			notifications.show({
				message: "Invalid field data",
			});
			return;
		}

		login(email!, password!);
	};
	return (
		<>
			<form
				onSubmit={handleSubmit}
				className="w-full min-h-screen flex items-center justify-center"
			>
				<Card className="w-full max-w-sm">
					<CardHeader>
						<CardTitle className="text-2xl">Login</CardTitle>
						<CardDescription>
							Enter your email below to login to your account.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-4">
						<div className="grid gap-2">
							<Label htmlFor="email">username</Label>
							<Input
								id="email"
								type="email"
								required
								onChange={(e) => setEmail(e?.target?.value)}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								required
								onChange={(e) => setPassword(e?.target?.value)}
							/>
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							className="w-full"
							disabled={loggingIn}
						>
							Sign in
						</Button>
					</CardFooter>
				</Card>
			</form>
		</>
	);
}
