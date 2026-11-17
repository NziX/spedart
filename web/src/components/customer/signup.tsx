import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerSchema, TCustomerFields } from "@/types/customer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import axios from "@/lib/axios.config";
import { notifications } from "@mantine/notifications";
import { ICustomer } from "@/types";
import { useState } from "react";

interface ICustomerSignUpModalProps {
	onSignUp: (data: ICustomer) => void;
	trigger?: React.ReactNode;
}

export default function CustomerSignUpModal({
	onSignUp,
	trigger,
}: ICustomerSignUpModalProps) {
	const [open, setOpen] = useState<boolean>(false);

	const form = useForm<TCustomerFields>({
		resolver: zodResolver(customerSchema),
	});

	const onSubmit = async (data: TCustomerFields) => {
		try {
			const { data: customerData } = await axios.post("/customers", data);
			notifications.show({
				title: "Customer created",
				message: "Customer created successfully",
				color: "green",
			});
			localStorage.setItem(
				"customer",
				JSON.stringify(customerData?.newCustomer)
			);
			onSignUp(customerData?.newCustomer);
		} catch (error: any) {
			console.log(error);
			notifications.show({
				title: "Failed to create customer",
				message: error?.response?.data?.message,
				color: "red",
			});
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Sign Up</DialogTitle>
					<DialogDescription>
						Join our awesome community
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)}>
						<div className="space-y-2">
							<div className="space-y-2">
								<FormField
									control={form.control}
									name="fullName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Full Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Your full name"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input
													placeholder="Your email"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="phoneNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Phone Number</FormLabel>
											<FormControl>
												<Input
													placeholder="2507xxxxxxx"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="flex items-center justify-end">
								<Button type="submit">Continue</Button>
							</div>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
