import { z, ZodError } from 'zod';

const adminSchema = z.object({
  username: z.string().min(3).max(60),
  email: z.string().email(),
  password: z.string().min(4).max(60),
});

export const validateAdmin = (data: any) => {
  try {
    const admin = adminSchema.parse(data);
    return admin;
  } catch (e: any) {
    const error = e as ZodError;
    throw new Error(error.errors[0].message ?? 'Invalid data');
  }
};
