// Exact port of platform-fe's components/lib/utils.ts (cn helper), minus
// the TypeScript ClassValue type annotation.
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
