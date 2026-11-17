import { z } from 'zod';

const artistSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  stageName: z.string().min(2),
  phoneNumber: z.string().min(8),
  email: z.string().email(),
  bio: z.string().optional(),
  profilePicture: z.string().optional(),
  isVerified: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  password: z.string().min(2),
  socials: z
    .object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      website: z.string().optional(),
    })
    .optional(),
  paymentInfo: z
    .object({
      momo: z.string().optional(),
    })
    .optional(),
  verificationCode: z
    .object({
      code: z.number().optional(),
      expiresAt: z.date().optional(),
    })
    .optional(),
});

export const validateArtist = (data: any) => {
  const artist = artistSchema.safeParse(data);
  if (!artist.success) {
    throw new Error(artist.error.errors[0].message);
  }
  return artist.data;
};
