import { ar } from './ar';
import { en } from './en';

export type Locale = typeof ar;

export const translations: Record<string, Locale> = { ar, en };
export const defaultLocale: Locale = ar;

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let result: any = locale;
  for (const k of keys) {
    if (result == null) return key;
    result = result[k];
  }
  return result ?? key;
}
