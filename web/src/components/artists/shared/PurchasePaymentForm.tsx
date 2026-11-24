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
    const activeRefId = localStorage.getItem("referenceId");

    if (!activeRefId) {
      setLoading(false);
      return notifications.show({
        title: "Payment not verified",
        message: "No payment made on this device",
        color: "red",
      });
    }

    try {
      const res = await axios.get(`/supports/verify-payment/${activeRefId}`);
      if (res.data?.success && res.data?.trackToken) {
        notifications.show({
          title: "Payment verified",
          message: "Your payment has been successfully verified!",
          color: "green",
        });
        localStorage.setItem("streamToken", res.data.trackToken);
        setGlobalPaymentStatus("SUCCESSFUL");
        setLoading(false);
        onSuccess();
      } else {
        notifications.show({
          title: "Payment pending",
          message:
            res.data?.message ||
            "Payment is still pending. Please confirm on your phone.",
          color: "yellow",
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.log(error);
      notifications.show({
        title: "Payment verification failed",
        message: error?.response?.data?.message || "Payment verification error",
        color: "red",
      });
      setLoading(false);
    }
  };

  const onSubmit = async (data: TSupportPaymentFields) => {
    setLoading(true);
    try {
      const res = await axios.post("/supports", data);
      if (!res.data.success) {
        setLoading(false);
        return notifications.show({
          title: "Payment Failed",
          message: res.data?.message || "Could not initiate payment",
          color: "red",
        });
      }

      const refId =
        res.data.referenceId || res.data.support?.referenceId;
      if (refId) {
        localStorage.setItem("referenceId", refId);
      }

      if (res.data.trackToken) {
        notifications.show({
          title: "Payment successful",
          message: "Payment processed successfully! Loading song...",
          color: "green",
        });
        localStorage.setItem("streamToken", res.data.trackToken);
        setGlobalPaymentStatus("SUCCESSFUL");
        setLoading(false);
        onSuccess();
      } else {
        notifications.show({
          title: "Payment Initiated",
          message:
            res.data.message ||
            "Please approve the prompt on your phone, then click Verify.",
          color: "blue",
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.log(error);
      setGlobalPaymentStatus("FAILED");
      notifications.show({
        title: "Payment failed",
        message: error?.response?.data?.message || "Payment error",
        color: "red",
      });
      setLoading(false);
    }
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
