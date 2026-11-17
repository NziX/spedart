import { z } from "zod";

export const customerSchema = z.object({
	email: z.string().email(),
	phoneNumber: z.string().regex(/^250\d{9}$/),
	fullName: z.string(),
});

export type TCustomerFields = z.infer<typeof customerSchema>;
