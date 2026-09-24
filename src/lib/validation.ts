const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const URL_RE = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim().toLowerCase());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s-]/g, "");
  return PHONE_RE.test(digits) || /^\+?[1-9]\d{7,14}$/.test(digits);
}

export function isValidPassword(value: string): string | null {
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(value)) return "Password must include at least one letter.";
  if (!/\d/.test(value)) return "Password must include at least one number.";
  return null;
}

export function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  return URL_RE.test(value.trim());
}

export function isValidGst(value: string): boolean {
  if (!value.trim()) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value.trim().toUpperCase());
}

export function required(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}
