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

  const handleSubmit = async (amount: number) => {
    setProcessPending(true);
    if (amount < 0) {
      setProcessPending(false);
      return notifications.show({
        title: "Invalid Amount",
        message: "Amount can't be less than 0.",
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

    if (!artist?.phoneNumber) {
      setProcessPending(false);
      return notifications.show({
        title: "Invalid Phone Number",
        message: "Add a phone number to continue",
        color: "orange",
      });
    }

    try {
      await axios
        .post("/supports/withdraw", {
          amount: amount,
          phoneNumber: artist?.phoneNumber,
        })
        .then((res) => {
          refetchBalance();
        });
    } catch (error: any) {
      setProcessPending(false);
      notifications.show({
        title: "Error Withdrawing",
        message:
          error?.response?.data?.message ?? "An error occured when withdrawing",
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
          <div className="mb-2">
            <p className="font-medium">Current Balance</p>
            <p className="text-green-600 font-medium">
              {balanceInformation?.balance ?? 0} RWF
            </p>
          </div>
          <div className="space-y-2 mb-4">
            <p>Enter amount to withdraw</p>
            <Input
              name="amount"
              placeholder="Withdrawal amount"
              type="number"
              onChange={(e) => setAmount(Number(e?.target?.value))}
              defaultValue={balanceInformation?.balance ?? 0}
            />
          </div>
          <Button
            onClick={() => handleSubmit(amount)}
            className="p-2 w-full rounded-sm text-white"
            disabled={processPending}
          >
            Withdraw
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
