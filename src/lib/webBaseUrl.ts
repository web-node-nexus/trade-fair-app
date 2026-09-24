/** Public website URLs for emails / share links. Never return localhost. */
export function getWebBaseUrl(): string {
  const raw =
    process.env.EXPO_PUBLIC_WEB_BASE_URL?.replace(/\/$/, "") ??
    process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, "") ??
    "https://tradefairwala.com";
  if (/localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+/i.test(raw)) {
    return "https://tradefairwala.com";
  }
  return raw;
}

export function webPageUrl(path: string): string {
  const base = getWebBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Slug → page title for marketing/legal routes (native screens). */
export const MARKETING_PAGES: Record<string, { title: string; path: string }> = {
  features: { title: "Features", path: "/features" },
  "how-it-works": { title: "How it works", path: "/how-it-works" },
  "for-organizers": { title: "For organizers", path: "/for-organizers" },
  "for-exhibitors": { title: "For exhibitors", path: "/for-exhibitors" },
  "for-visitors": { title: "For visitors", path: "/for-visitors" },
  "for-service-providers": { title: "For service providers", path: "/register" },
  "organizer-checklist": { title: "Organizer checklist", path: "/organizer-checklist" },
  "help-center": { title: "Help center", path: "/help-center" },
  faq: { title: "FAQ", path: "/faq" },
  about: { title: "About", path: "/about" },
  partners: { title: "Partners", path: "/partners" },
  press: { title: "Press", path: "/press" },
  careers: { title: "Careers", path: "/careers" },
  "privacy-policy": { title: "Privacy policy", path: "/privacy-policy" },
  "terms-of-service": { title: "Terms & Conditions", path: "/terms-of-service" },
  "payment-refund-policy": { title: "Payment & refund policy", path: "/payment-refund-policy" },
  "cookie-policy": { title: "Cookie policy", path: "/cookie-policy" },
  "acceptable-use-policy": { title: "Acceptable use", path: "/acceptable-use-policy" },
  "data-processing-addendum": { title: "Data processing", path: "/data-processing-addendum" },
  "community-guidelines": { title: "Community guidelines", path: "/community-guidelines" },
  "security-practices": { title: "Security", path: "/security-practices" },
  "gdpr-information": { title: "GDPR", path: "/gdpr-information" },
  "accessibility-statement": { title: "Accessibility", path: "/accessibility-statement" },
};

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
];

export const ORGANIZATION_TYPES = ["Company", "Government", "Association", "Individual", "Other"];
export const BUSINESS_CATEGORIES = ["Manufacturing", "Trading", "Services", "Technology", "Food & Beverage", "Other"];
