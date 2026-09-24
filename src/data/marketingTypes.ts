export type MarketingSection = {
  heading: string;
  body?: string;
  bullets?: string[];
};

export type MarketingPage = {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  /** Optional local require() image for marketing hero */
  heroImage?: number;
  sections: MarketingSection[];
  cta?: { label: string; route: string };
};
