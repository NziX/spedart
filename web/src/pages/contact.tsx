import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Head from "next/head";
import { FormEvent, useState, useRef, ElementRef } from "react";
import { BiPhone } from "react-icons/bi";
import { MdEmail } from "react-icons/md";
import { notifications } from "@mantine/notifications";
import axios from "@/lib/axios.config";
import { contacts } from "@/lib/constants";
import { Loader } from "lucide-react";

export default function ContactUs() {
	const [loading, setLoading] = useState(false);
	const formRef = useRef<ElementRef<"form">>(null);

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		const name = form.get("name") as string;
		const email = form.get("email") as string;
		const message = form.get("message") as string;
		setLoading(true);
		try {
			await axios.post("/contact-messages", { name, email, message });
			notifications.show({
				title: "Message Sent",
				message:
					"Your message has been sent. We will get back to you as soon as possible",
				color: "teal",
			});
			formRef.current?.reset();
		} catch (error) {
			console.log(error);
			notifications.show({
				title: "Error",
				message: "An error occurred. Please try again",
				color: "red",
			});
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Head>
				<title>Contact Us - supported</title>
			</Head>
			<MainLayout>
				<div className="w-full py-20 px-4 md:px-6">
					<div className="w-full mx-auto max-w-4xl flex flex-col items-center gap-y-10">
						<h1 className="font-semibold text-5xl text-primary-text text-center">
							Contact Us
						</h1>
						<p className="text-center max-w-lg">
							Feel free to contact us any time. We will get back
							to you as soon as possible
						</p>
						<div className="flex flex-col md:flex-row gap-5 w-full text-lg">
							<div className="bg-[#FBEFFF] flex w-full md:w-1/2 items-center justify-center gap-x-2 px-4 py-2">
								<BiPhone className="text-xl" />
								<p>{contacts.phone}</p>
							</div>
							<div className="bg-[#FBEFFF] flex w-full md:w-1/2 items-center justify-center gap-x-2 px-4 py-2">
								<MdEmail className="text-xl" />
								<p>{contacts.email}</p>
							</div>
						</div>
						<form
							ref={formRef}
							onSubmit={handleSubmit}
							className="w-full space-y-5"
						>
							<Input
								placeholder="Names"
								name="name"
								className="w-full bg-[#FEFAFF]"
								minLength={2}
							/>
							<Input
								placeholder="Email"
								type="email"
								name="email"
								className="bg-[#FEFAFF]"
							/>
							<Textarea
								placeholder="Message"
								className="bg-[#FEFAFF]"
								name="message"
								required
								minLength={2}
							/>
							<Button
								disabled={loading}
								type="submit"
								className="w-full"
							>
								{loading ? (
									<Loader
										color="white"
										className="animate-spin"
									/>
								) : (
									"Send"
								)}
							</Button>
						</form>
					</div>
				</div>
			</MainLayout>
		</>
	);
}
