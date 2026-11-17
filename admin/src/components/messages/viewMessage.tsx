import React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { IContactMessage } from "@/types";

interface IViewContactMessageProps {
	trigger: React.ReactNode;
	message: IContactMessage;
}

export default function ViewContactMessage({
	trigger,
	message,
}: IViewContactMessageProps) {
	return (
		<Dialog>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px] p-6">
				<DialogHeader>
					<DialogTitle>Contact Message</DialogTitle>
					<DialogDescription>
						Viewing Message from:{" "}
						<span className="underline font-semibold">
							{message?.name}
						</span>
					</DialogDescription>
				</DialogHeader>
				<div className="mt-4 p-4 bg-gray-100 rounded-md shadow-md">
					<div className="mb-2">
						<span className="font-semibold">Message:</span>
						<p className="mt-1 whitespace-pre-line">
							{message?.message}
						</p>
					</div>
					<div className="text-right text-sm text-gray-500">
						Sent on: {new Date(message?.createdAt).toLocaleString()}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
