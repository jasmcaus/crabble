import clsx, { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** clsx + tailwind-merge, the shadcn/ui class helper. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
