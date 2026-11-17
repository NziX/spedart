import { z } from "zod";

export const paymentSchema = z
  .object({
    artist: z.string().min(1),
    amount: z.number().int().gt(0, {
      message: "Amount should be greater than 0",
    }),
    currency: z.enum(["RWF"]),
    type: z.enum(["SUPPORT", "PURCHASE"]),
    status: z.enum(["PENDING", "RECEIVED", "PAID"]),
    providedBy: z.object({
      name: z.string(),
      email: z.string().email(),
      phoneNumber: z.string().regex(/^0\d{9}$/, {
        message: "Should start with 07 and have 10 digits",
      }),
    }),
    art: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "PURCHASE" && !data.art) {
        return false;
      }
      return true;
    },
    {
      message: "Art is required for purchase",
    },
  );

export type TSupportPaymentFields = z.infer<typeof paymentSchema>;
