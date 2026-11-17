import { Socials } from "@/types";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const socialsPatterns = {
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
  twitter: /^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+\/?$/,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
  youtube: /^(https?:\/\/)?(www\.)?youtube\.com\/channel\/[a-zA-Z0-9-]+\/?$/,
  website: /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+\/?$/,
};

export function generatePageTitle(title: string) {
  return title + " - Supported"
}

export const getObjValue = (key: string | number, obj: any) => {
  const keys = key.toString().split('.');
  let result = obj;
  for (const key of keys) {
    if (result && Object.prototype.hasOwnProperty.call(result, key)) {
      result = result[key];
    } else {
      return undefined;
    }
  }
  return result as string;
};

export const validateSocials = (socials: Socials) => {


  const schema = z.object({
    instagram: z.string().regex(socialsPatterns.instagram).optional(),
    twitter: z.string().regex(socialsPatterns.twitter).optional(),
    facebook: z.string().regex(socialsPatterns.facebook).optional(),
    youtube: z.string().regex(socialsPatterns.youtube).optional(),
    website: z.string().regex(socialsPatterns.website).optional(),
  });

  return schema.safeParse(socials);
}