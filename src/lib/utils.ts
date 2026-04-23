import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPriceFcfa = (price: number): string => {
  return `${Math.round(price).toLocaleString('fr-FR')} FCFA`;
};

