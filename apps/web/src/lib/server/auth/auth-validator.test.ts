import { describe, expect, it } from 'vitest';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  validateEmail,
  validatePassword,
  validateRequiredString,
} from '@sourcetool/shared';

describe('validateEmail', () => {
  it('accepts a well-formed address', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('rejects missing, empty, or non-string values', () => {
    expect(validateEmail(undefined)).toBe('Email is required');
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
    expect(validateEmail({ malicious: true })).toBe('Email is required');
  });

  it('rejects malformed addresses', () => {
    expect(validateEmail('not-an-email')).toBe('Invalid email address');
    expect(validateEmail('user@')).toBe('Invalid email address');
    expect(validateEmail('user @example.com')).toBe('Invalid email address');
  });
});

describe('validatePassword', () => {
  it('accepts a password within bounds', () => {
    expect(validatePassword('correcthorse')).toBeNull();
  });

  it('rejects missing or non-string values', () => {
    expect(validatePassword(undefined)).toBe('Password is required');
    expect(validatePassword(12345678 as unknown)).toBe('Password is required');
  });

  it('rejects passwords that are too short', () => {
    expect(validatePassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  });

  it('rejects passwords that are too long', () => {
    expect(validatePassword('a'.repeat(PASSWORD_MAX_LENGTH + 1))).toBe(
      `Password must be at most ${PASSWORD_MAX_LENGTH} characters`,
    );
  });
});

describe('validateRequiredString', () => {
  it('accepts a non-empty string', () => {
    expect(validateRequiredString('token', 'Token')).toBeNull();
  });

  it('rejects empty or non-string values with the field name', () => {
    expect(validateRequiredString('', 'Token')).toBe('Token is required');
    expect(validateRequiredString(null, 'Token')).toBe('Token is required');
  });
});
