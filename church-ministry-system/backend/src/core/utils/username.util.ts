export const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

export const USERNAME_MESSAGE =
  'Username must be 3-30 characters using lowercase letters, digits, dot, underscore or hyphen';

export function normalizeUsername(value: unknown): string {
  if (typeof value !== 'string') return value as any;
  return value.trim().toLowerCase();
}
