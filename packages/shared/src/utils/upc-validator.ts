export function isValidUpc(value: string): boolean {
  if (!value || !/^\d{12}$/.test(value)) return false;
  return validateCheckDigit(value);
}

export function isValidEan(value: string): boolean {
  if (!value || !/^\d{13}$/.test(value)) return false;
  return validateCheckDigit(value);
}

function validateCheckDigit(code: string): boolean {
  const digits = code.split('').map(Number);
  const checkDigit = digits.pop()!;
  const sum = digits.reduce((acc, digit, index) => {
    return acc + digit * (index % 2 === 0 ? 1 : 3);
  }, 0);
  const calculated = (10 - (sum % 10)) % 10;
  return calculated === checkDigit;
}
