export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only consumes the first 72 bytes; cap input to avoid unbounded hashing work.
export const PASSWORD_MAX_LENGTH = 72;
export const EMAIL_MAX_LENGTH = 254;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= EMAIL_MAX_LENGTH &&
    EMAIL_RE.test(value.trim())
  );
}

/** Returns an error message when invalid, otherwise null. */
export function validateEmail(value: unknown): string | null {
  if (typeof value !== 'string' || value.trim() === '') return 'Email is required';
  if (!isValidEmail(value)) return 'Invalid email address';
  return null;
}

/** Strength check for passwords the user is setting (register / reset). */
export function validatePassword(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return 'Password is required';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (value.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
  }
  return null;
}

export function validateRequiredString(value: unknown, field = 'Value'): string | null {
  if (typeof value !== 'string' || value.trim() === '') return `${field} is required`;
  return null;
}
