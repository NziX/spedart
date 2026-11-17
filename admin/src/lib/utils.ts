import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generatePageTittle(title: string) {
  return `${title} | Supported`
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