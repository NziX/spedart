import axios from "@/lib/axios.config";
import { Artist } from "@/types";
import { useEffect, useState } from "react";
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
import { FaMoneyBill } from "react-icons/fa";

interface IPayArtistProps {
	artist: Artist;
	onPay: () => void;
}

export default function PayArtistModal({ artist, onPay }: IPayArtistProps) {
	const [remainingBalance, setRemainingBalance] = useState<number>(0);
	const [totalPaid, setTotalPaid] = useState<number>(0);

	const checkRemainingBalance = async () => {
		const { data } = await axios.get(
			`supports/total-payments/by-artist/${artist._id}`
		);

		setTotalPaid(data?.totalPaid || 0);
		setRemainingBalance(
			(data?.totalPayments || 0) - (data?.paidAmount || 0)
		);
	};

	useEffect(() => {
		if (artist._id) {
			checkRemainingBalance();
		}
	}, [artist._id]);

	return (
		<>
			<Dialog>
				<DialogTrigger asChild>
					<Button
						variant={"outline"}
						className="flex space-x-2 items-center justify-center"
					>
						<FaMoneyBill />
						<p>Pay Artist</p>
					</Button>
				</DialogTrigger>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Pay Artist</DialogTitle>
						<DialogDescription>
							Easy way to pay your artist
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2">
						<p className="text-sm">
							Total Paid:{" "}
							<span className="font-bold text-green-500">
								RWF {totalPaid?.toLocaleString()}
							</span>
						</p>
						<p className="text-sm">
							Remaining Balance:{" "}
							<span className="font-bold text-yellow-500">
								RWF {remainingBalance?.toLocaleString()}
							</span>
						</p>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="customAmount">Pay Custom Amount</Label>
						<Input
							id="customAmount"
							type="number"
							required
							placeholder="Enter amount to pay"
							// onChange={(e) => setEmail(e?.target?.value)}
						/>
					</div>

					<Button className="flex space-x-2 items-center justify-center">
						<FaMoneyBill />
						<p>Pay Artist</p>
					</Button>
				</DialogContent>
			</Dialog>
		</>
	);
}
