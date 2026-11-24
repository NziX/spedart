import { showBalanceState } from "@/atoms";
import { useRecoilState } from "recoil";
import ModalLayout from "../ModalLayout";
import { Button } from "../ui/button";
import axios from "@/lib/axios.config";
import useSWR from "swr";
import { Input } from "../ui/input";
import { notifications } from "@mantine/notifications";
import useAuth from "@/hooks/useAuth";
import { useState, useEffect } from "react";

export default function AritstBalanceModal() {
  const [show, setShow] = useRecoilState(showBalanceState);
  const [amount, setAmount] = useState<number>(0);
  const { artist } = useAuth();
  const [payoutPhone, setPayoutPhone] = useState<string>(
    artist?.phoneNumber || "",
  );
  const [processPending, setProcessPending] = useState(false);

  const { data: balanceInformation, mutate: refetchBalance } = useSWR(
    "/supports/account-balance",
    async (url) => {
      const { data } = await axios.get(url);
      if (data) {
        setProcessPending(false);
      }
      return data;
    },
  );

  useEffect(() => {
    if (artist?.phoneNumber && !payoutPhone) {
      setPayoutPhone(artist.phoneNumber);
    }
  }, [artist?.phoneNumber, payoutPhone]);

  const handleSubmit = async () => {
    setProcessPending(true);
    if (amount <= 0) {
      setProcessPending(false);
      return notifications.show({
        title: "Invalid Amount",
        message: "Amount must be greater than 0.",
        color: "orange",
      });
    }

    if (amount > (balanceInformation?.balance ?? 0)) {
      setProcessPending(false);
      return notifications.show({
        title: "Invalid Amount",
        message: "Amount can't be greater than balance",
        color: "orange",
      });
    }

    const phoneToUse = payoutPhone.trim() || artist?.phoneNumber;
    if (!phoneToUse) {
      setProcessPending(false);
      return notifications.show({
        title: "Invalid Phone Number",
        message: "Add a phone number to continue",
        color: "orange",
      });
    }

    try {
      const res = await axios.post("/supports/withdraw", {
        amount: amount,
        phoneNumber: phoneToUse,
      });

      notifications.show({
        title: "Withdrawal Submitted",
        message:
          res.data?.message ||
          "Your withdrawal has been processed successfully.",
        color: "green",
      });

      await refetchBalance();
      setProcessPending(false);
      setShow(null);
    } catch (error: any) {
      setProcessPending(false);
      notifications.show({
        title: "Error Withdrawing",
        message:
          error?.response?.data?.message ??
          "An error occurred when withdrawing",
        color: "orange",
      });
    }
  };

  useEffect(() => {
    setAmount(balanceInformation?.balance ?? 0);
  }, [balanceInformation?.balance]);

  return (
    <ModalLayout open={Boolean(show?.show)} onClose={() => setShow(null)}>
      <div className="py-2 border-b mb-5">
        <h3 className="font-semibold text-lg text-gray-700">
          Your Balance Information
        </h3>
      </div>
      <div className="flex flex-col gap-y-4 space-y-5 mb-10">
        <div className="w-full p-2 border rounded-sm gap-4">
          <div className="mb-4">
            <p className="font-medium text-sm text-gray-600">Current Balance</p>
            <p className="text-green-600 font-bold text-2xl">
              {balanceInformation?.balance ?? 0} RWF
            </p>
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium">Enter amount to withdraw (RWF)</p>
            <Input
              name="amount"
              placeholder="Withdrawal amount"
              type="number"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e?.target?.value))}
            />
          </div>
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium">Mobile Money Number</p>
            <Input
              name="phoneNumber"
              placeholder="07xxxxxxxx"
              value={payoutPhone}
              onChange={(e) => setPayoutPhone(e?.target?.value)}
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="p-2 w-full rounded-sm text-white"
            disabled={processPending}
          >
            {processPending ? "Processing..." : "Withdraw Funds"}
          </Button>
        </div>
        <div className="w-full flex items-center gap-x-3"></div>
      </div>
      <Button
        onClick={() => setShow(null)}
        className="w-full"
        variant={"outline"}
      >
        Close
      </Button>
    </ModalLayout>
  );
}
