import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuth from "@/hooks/useAuth";
import { signUpSchema } from "@/types/auth";
import { notifications } from "@mantine/notifications";
import { FormEvent, useState } from "react";

interface ICreateAdminModalProps {
	onCreate: () => void;
	trigger: React.ReactNode;
}

export default function CreateAdminModal({
	onCreate,
	trigger,
}: ICreateAdminModalProps) {
	const { signup, signingUp } = useAuth();

	const [email, setEmail] = useState<string>();
	const [password, setPassword] = useState<string>();
	const [username, setUsername] = useState<string>();
	const [open, setIsOpen] = useState<boolean>(false);

	const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		const validateFields = signUpSchema.safeParse({
			email,
			password,
			username,
		});

		if (!validateFields) {
			notifications.show({
				message: "Invalid field data",
			});
			return;
		}

		signup(
			{ email: email!, password: password!, username: username! },
			() => {
				setIsOpen(false);
				onCreate();
			}
		);
	};

	return (
		<Dialog open={open} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create Admin</DialogTitle>
					<DialogDescription>
						Create a new admin account by filling out the form
						below.
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="grid gap-2">
						<Label htmlFor="username">Username</Label>
						<Input
							id="username"
							type="text"
							required
							onChange={(e) => setUsername(e?.target?.value)}
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="email">Email</Label>
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

					<Button
						type="submit"
						className="w-full"
						disabled={signingUp}
					>
						Create Account
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
