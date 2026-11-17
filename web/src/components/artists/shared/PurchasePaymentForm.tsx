import { paymentState } from "@/atoms";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import axios from "@/lib/axios.config";
import { Art, IArtist } from "@/types";
import { TSupportPaymentFields, paymentSchema } from "@/types/payments";
import { zodResolver } from "@hookform/resolvers/zod";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRecoilState } from "recoil";

interface IPaymentFormProps {
  amount: number;
  artist: IArtist;
  art: Art;
  onSuccess: () => void;
}

export function PurchasePaymentForm({
  amount,
  artist,
  art,
  onSuccess,
}: IPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [_, setGlobalPaymentStatus] = useRecoilState(paymentState);
  const referenceId = localStorage.getItem("referenceId");
  const form = useForm<TSupportPaymentFields>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      artist: artist._id,
      currency: "RWF",
      type: "PURCHASE",
      status: "PENDING",
      amount: Number(amount ?? 0),
      art: art._id,
    },
  });

  const verifyPayment = async () => {
    setLoading(true);

    if (!referenceId) {
      setLoading(false);
      return notifications.show({
        title: "Payment not verified",
        message: "No payment made on this device",
        color: "red",
      });
    }

    await axios
      .get(`/supports/verify-payment/${referenceId}`)
      .then((res) => {
        notifications.show({
          title: "Payment verified",
          message: "Your payment has been successfully verified",
          color: "green",
        });
        localStorage.setItem("streamToken", res?.data?.trackToken);
        setGlobalPaymentStatus("SUCCESSFUL");
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        console.log(error);
        notifications.show({
          title: "Payment verification failed",
          message: "Payment verification error",
          color: "red",
        });
        setLoading(false);
      });
  };

  const onSubmit = async (data: TSupportPaymentFields) => {
    setLoading(true);
    await axios
      .post("/supports", data)
      .then((res) => {
        if (!res.data.success) {
          localStorage.setItem("referenceId", res.data.support.referenceId);
          setLoading(false);
          return notifications.show({
            title: "Payment Requested",
            message: "Finalize Payment to Proceed",
            color: "yellow",
          });
        }

        notifications.show({
          title: "Payment successful",
          message: "Your payment has been successfully processed",
          color: "green",
        });
        localStorage.setItem("streamToken", res?.data?.trackToken);
        setGlobalPaymentStatus("SUCCESSFUL");
        setLoading(false);
        onSuccess();
      })
      .catch((error) => {
        console.log(error);
        setGlobalPaymentStatus("FAILED");
        notifications.show({
          title: "Payment failed",
          message: "Payment error",
          color: "red",
        });
        setLoading(false);
      });
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="providedBy.name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="providedBy.email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="providedBy.phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="07xxxxxxxx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    placeholder="amount"
                    {...field}
                    disabled
                    defaultValue={amount}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <FormField
					control={form.control}
					name="currency"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Currency</FormLabel>
							<FormControl>
								<Input
									disabled
									{...field}
									defaultValue={"EUR"}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/> */}
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              Pay
            </Button>
          </div>
        </form>
      </Form>

      <div className="space-y-4">
        <p className="text-sm text-center">Already Purchased the Song?</p>
        <Button
          className="w-full font-bold"
          variant={"secondary"}
          disabled={loading}
          onClick={verifyPayment}
        >
          Verify
        </Button>
      </div>
    </div>
  );
}
