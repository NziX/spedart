import { z } from 'zod';

const customerSchema = z.object({
  email: z.string().email(),
  phoneNumber: z.string().regex(/^250\d{9}$/),
  fullName: z.string(),
});

export const validateCustomer = (data: any) => {
  const customer = customerSchema.safeParse(data);
  if (!customer.success) {
    throw new Error(customer.error.errors[0].message);
  }
  return customer.data;
};
