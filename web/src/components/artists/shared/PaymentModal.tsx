import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from "@/components/ui/dialog";
import { Art, IArtist } from "@/types";
import { useState } from "react";
import { PurchasePaymentForm } from "./PurchasePaymentForm";
import SupportPaymentForm from "./SupportPaymentForm";

// Define the interface with a union type
interface ISupportPaymentModalProps {
	trigger: React.ReactNode;
	source: "support";
	title: string;
	description: string;
	artist: IArtist;
}

interface IPaymentPaymentModalProps {
	trigger: React.ReactNode;
	source: "purchase";
	title: string;
	description: string;
	amount: number;
	artist: IArtist;
	art: Art;
}

type IPaymentModalProps = ISupportPaymentModalProps | IPaymentPaymentModalProps;

export function PaymentModal({
	trigger,
	source,
	title,
	description,
	//@ts-ignore
	amount,
	//@ts-ignore
	art,
	artist,
}: IPaymentModalProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{trigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				{source === "support" && (
					<SupportPaymentForm
						artist={artist}
						onSuccess={() => setIsOpen(false)}
					/>
				)}
				{source === "purchase" && (
					<PurchasePaymentForm
						amount={amount}
						artist={artist}
						art={art}
						onSuccess={() => setIsOpen(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}
