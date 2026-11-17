import { z } from 'zod';

const contactMessageSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  message: z.string().min(2).max(5000),
});

export const validateContactMessage = (data: any) => {
  try {
    const contactMessage = contactMessageSchema.parse(data);
    return contactMessage;
  } catch (error) {
    throw new Error('Invalid data');
  }
};
