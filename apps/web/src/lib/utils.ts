import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: string | number, currency = 'DOP') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('es-DO', { style: 'currency', currency }).format(isNaN(n) ? 0 : n);
}
