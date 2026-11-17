import { z } from 'zod';

const artSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  type: z.enum(['SONG']).optional(),
  thumbnail: z.string().min(1),
  song: z.object({
    key: z.string().min(1),
    size: z.number(),
    url: z.string().min(1),
  }),
  description: z.string().optional(),
  pricing: z.object({
    paid: z.boolean(),
    price: z.number().optional(),
    currency: z.enum(['USD', 'RWF']).optional(),
  }),
  // status: z.enum(["DRAFT", "PUBLISHED"]),
  likes: z.number().optional(),
  releaseDate: z.string().optional(),
});

export const validateArt = (data: any) => {
  const art = artSchema.safeParse(data);
  if (!art.success) {
    console.log(art.error);
    throw new Error(art.error.errors[0].message);
  }
  return art.data;
};
