import { paymentRefundPolicyPage, privacyPolicyPage, termsOfServicePage } from "./legalContent";
import type { MarketingPage, MarketingSection } from "./marketingTypes";

export type { MarketingPage, MarketingSection };

export const MARKETING_CONTENT: Record<string, MarketingPage> = {
  features: {
    title: "Features",
    subtitle: "Everything you need to run or join trade fairs.",
    icon: "sparkles",
    accent: "#10b981",
    sections: [
      {
        heading: "For everyone",
        bullets: [
          "Browse fairs by city, industry & date",
          "Secure payments with instant receipts",
          "Real-time notifications & inbox",
          "QR passes for gate entry",
        ],
      },
      {
        heading: "For organizers",
        bullets: [
          "Create events with floor plans",
          "Sell stalls & visitor tickets",
          "Manage exhibitors & gate staff",
          "Reports & CSV exports",
        ],
      },
    ],
    cta: { label: "Explore trade fairs", route: "/(tabs)/trade-fairs" },
  },
  "how-it-works": {
    title: "How it works",
    subtitle: "Three simple steps to get started.",
    icon: "git-branch-outline",
    accent: "#0369a1",
    sections: [
      { heading: "1. Discover", body: "Search exhibitions near you or in your industry." },
      { heading: "2. Book", body: "Reserve a stall, buy tickets, or hire booth services." },
      { heading: "3. Show up", body: "Use your QR pass at the gate — we handle the rest." },
    ],
    cta: { label: "Get started", route: "/(auth)/register" },
  },
  "for-organizers": {
    title: "Grow Your Exhibition Reach Across India",
    subtitle: "List, Promote & Manage Your Trade Shows — All in One Place",
    icon: "business",
    accent: "#0f766e",
    heroImage: require("../../assets/marketing/organizers-hero.png"),
    sections: [
      {
        heading: "About TradeFairWala for organizers",
        body: "TradeFairWala helps exhibition organizers attract more exhibitors, increase event visibility, manage inquiries, and connect with trusted vendors across India.",
      },
      {
        heading: "Why Organizers Choose TradeFairWala",
        bullets: [
          "More Exhibitor Leads — Reach thousands of businesses looking for exhibitions",
          "Maximum Event Visibility — Promote to the right industries, cities & communities",
          "Easy Inquiry Management — Manage exhibitor inquiries from one dashboard",
          "Digital Promotion — Featured listings, newsletters, social & campaigns",
          "Trusted Vendor Network — Stall fabricators, AV, logistics, printers & more",
          "Organizer Dashboard — Update events, bookings, inquiries & performance live",
        ],
      },
      {
        heading: "Everything You Need to Organize a Successful Exhibition",
        bullets: [
          "Publish exhibitions in minutes",
          "Receive direct exhibitor inquiries",
          "Promote upcoming events",
          "Connect with verified vendors",
          "Manage multiple exhibitions",
          "Share brochures, floor plans & booking details",
          "Track inquiries and engagement",
          "Increase exhibitor participation",
        ],
      },
      {
        heading: "Who Can Register?",
        bullets: [
          "Exhibition Organizers",
          "Trade Show Companies",
          "Event Management Companies",
          "Industry Associations",
          "Chambers of Commerce",
          "Government Organizations",
          "Convention & Expo Centres",
        ],
      },
      {
        heading: "Why TradeFairWala?",
        body: "TradeFairWala is India's dedicated platform for trade fairs and exhibitions. We connect organizers, exhibitors, visitors, and service providers on a single platform. Whether you're organizing a regional expo or a large international trade show, TradeFairWala helps you reach the right audience and grow your event.",
      },
      {
        heading: "Ready to Grow Your Next Exhibition?",
        body: "Join hundreds of organizers using TradeFairWala to promote events, generate exhibitor leads, and simplify exhibition management.",
      },
    ],
    cta: { label: "Sign in to list exhibition", route: "/(auth)/login?accountType=organizer" },
  },
  "for-exhibitors": {
    title: "For exhibitors",
    subtitle: "Find fairs, book booths, grow your brand.",
    icon: "storefront",
    accent: "#065f46",
    sections: [
      {
        heading: "Book your booth",
        bullets: [
          "Browse upcoming fairs & floor maps",
          "Pick stalls and pay securely",
          "Manage bookings & documents",
        ],
      },
      {
        heading: "Build your presence",
        bullets: [
          "Hire designers, electricians & more",
          "Chat with organizers",
          "Save favourite events",
        ],
      },
    ],
    cta: { label: "Sign in as exhibitor", route: "/(auth)/login?accountType=exhibitor" },
  },
  "for-visitors": {
    title: "Discover Trade Fairs Across India",
    subtitle: "Find the Right Exhibition for Your Business",
    icon: "ticket",
    accent: "#0369a1",
    heroImage: require("../../assets/marketing/visitors-hero.png"),
    sections: [
      {
        heading: "About visiting with TradeFairWala",
        body: "Explore thousands of trade fairs, expos, and industry events across India. Connect with exhibitors, discover new products, meet suppliers, and grow your business—all from one platform.",
      },
      {
        heading: "Why Visit Through TradeFairWala?",
        bullets: [
          "Discover Relevant Events — Search by industry, city, or date",
          "Plan Your Visit — Details, venue, timings, exhibitors & floor plans",
          "Meet Leading Brands — Manufacturers, suppliers, distributors & startups",
          "Stay Updated — Alerts for exhibitions, deadlines & launches",
          "Save Your Favorites — Bookmark events and build your calendar",
          "Easy Registration — Register online and get entry quickly",
        ],
      },
      {
        heading: "Everything You Need in One Place",
        bullets: [
          "Explore exhibitions across India",
          "Search by industry, city, or date",
          "View exhibitor and product information",
          "Get venue directions and event schedules",
          "Save favorite exhibitions",
          "Receive event reminders and updates",
          "Discover new products and business opportunities",
          "Network with industry professionals",
        ],
      },
      {
        heading: "Who Can Register?",
        bullets: [
          "Business Owners",
          "Manufacturers",
          "Retailers",
          "Distributors",
          "Dealers",
          "Importers & Exporters",
          "Procurement Teams",
          "Entrepreneurs",
          "Startups",
          "Students & Professionals",
          "Industry Associations",
        ],
      },
      {
        heading: "Why Choose TradeFairWala?",
        body: "TradeFairWala is India's dedicated platform for discovering trade fairs and exhibitions. Whether you're looking for new suppliers, business partnerships, market trends, or innovative products, we help you find the right events—all in one place.",
      },
      {
        heading: "Ready to Explore Your Next Exhibition?",
        body: "Join thousands of business visitors who use TradeFairWala to discover exhibitions, connect with exhibitors, and unlock new business opportunities.",
      },
    ],
    cta: { label: "Sign in as visitor", route: "/(auth)/login?accountType=visitor" },
  },
  "for-service-providers": {
    title: "For service providers",
    subtitle: "List booth services and grow your exhibition business.",
    icon: "construct",
    accent: "#5b21b6",
    sections: [
      {
        heading: "List your services",
        bullets: [
          "Booth design, AV, catering & logistics",
          "Get direct enquiries from exhibitors",
          "Manage bookings from one dashboard",
        ],
      },
      {
        heading: "Build reputation",
        bullets: [
          "Showcase portfolio and pricing",
          "Respond to leads quickly",
          "Earn reviews from happy clients",
        ],
      },
    ],
    cta: { label: "Sign in as service provider", route: "/(auth)/login?accountType=service_provider" },
  },
  "organizer-checklist": {
    title: "Organizer checklist",
    subtitle: "Launch your fair with confidence.",
    icon: "checkbox-outline",
    accent: "#0f766e",
    sections: [
      {
        heading: "Before launch",
        bullets: [
          "Complete KYC & bank details",
          "Upload floor plan & stall layout",
          "Set pricing, tickets & dates",
        ],
      },
      {
        heading: "During the fair",
        bullets: [
          "Monitor gate scans live",
          "Send announcements to exhibitors",
          "Handle support tickets quickly",
        ],
      },
    ],
  },
  "help-center": {
    title: "Help center",
    subtitle: "Quick answers and support options.",
    icon: "help-circle",
    accent: "#10b981",
    sections: [
      {
        heading: "Common topics",
        bullets: [
          "Booking stalls & visitor tickets",
          "Payments, refunds & receipts",
          "Account, roles & verification",
          "Gate entry & QR passes",
        ],
      },
      {
        heading: "Need more help?",
        body: "Browse our FAQ or raise a support ticket — our team responds within 24 hours on business days.",
      },
    ],
    cta: { label: "Contact support", route: "/pages/contact" },
  },
  about: {
    title: "About Trade Fair Wala",
    subtitle: "India's marketplace for exhibitions.",
    icon: "information-circle",
    accent: "#0a1f3d",
    sections: [
      {
        heading: "Our mission",
        body: "We connect organizers, exhibitors, visitors and service providers on one trusted platform — making trade fairs as easy to book as your favourite marketplace app.",
      },
      {
        heading: "What we offer",
        bullets: [
          "Verified organizers & secure payments",
          "Stall booking with live floor plans",
          "Booth services marketplace",
          "Mobile-first experience across roles",
        ],
      },
    ],
  },
  partners: {
    title: "Partners",
    subtitle: "Grow with India's exhibition ecosystem.",
    icon: "people",
    accent: "#5b21b6",
    sections: [
      {
        heading: "Partner with us",
        body: "Venues, industry associations, media partners and service networks — we'd love to collaborate.",
      },
      {
        heading: "Get in touch",
        body: "Email partnerships@tradefairwala.com or use the contact form for partnership enquiries.",
      },
    ],
    cta: { label: "Contact us", route: "/pages/contact" },
  },
  press: {
    title: "Press",
    subtitle: "Media resources & enquiries.",
    icon: "newspaper-outline",
    accent: "#0a1f3d",
    sections: [
      {
        heading: "Media kit",
        body: "Request our logo pack, brand guidelines and company overview for editorial use.",
      },
      {
        heading: "Press contact",
        body: "Write to press@tradefairwala.com with your publication and deadline.",
      },
    ],
    cta: { label: "Contact us", route: "/pages/contact" },
  },
  careers: {
    title: "Careers",
    subtitle: "Build the future of exhibitions with us.",
    icon: "briefcase-outline",
    accent: "#e23744",
    sections: [
      {
        heading: "Open roles",
        body: "We're hiring engineers, designers and operations talent passionate about events and marketplaces.",
      },
      {
        heading: "Apply",
        body: "Send your resume to careers@tradefairwala.com with the role you're interested in.",
      },
    ],
  },
  "privacy-policy": privacyPolicyPage,
  "terms-of-service": termsOfServicePage,
  "payment-refund-policy": paymentRefundPolicyPage,
  "cookie-policy": {
    title: "Cookie policy",
    subtitle: "How we use cookies and similar tech.",
    icon: "nutrition-outline",
    accent: "#64748b",
    sections: [
      {
        heading: "On mobile",
        body: "The app uses secure storage and session tokens — not browser cookies — to keep you signed in.",
      },
      {
        heading: "Analytics",
        body: "We may use anonymized usage data to improve performance and fix issues.",
      },
    ],
  },
  "acceptable-use-policy": {
    title: "Acceptable use",
    subtitle: "Keep the marketplace safe for everyone.",
    icon: "hand-left-outline",
    accent: "#e23744",
    sections: [
      {
        heading: "You agree not to",
        bullets: [
          "Post fraudulent listings or bookings",
          "Harass users or organizers",
          "Attempt to bypass payments or security",
        ],
      },
    ],
  },
  "data-processing-addendum": {
    title: "Data processing",
    subtitle: "For business customers and organizers.",
    icon: "server-outline",
    accent: "#0a1f3d",
    sections: [
      {
        heading: "Processor role",
        body: "When organizers use our tools, we process exhibitor and visitor data on their behalf per applicable law.",
      },
      {
        heading: "Request DPA",
        body: "Contact legal@tradefairwala.com for a signed data processing agreement.",
      },
    ],
  },
  "community-guidelines": {
    title: "Community guidelines",
    subtitle: "Be respectful. Be professional.",
    icon: "heart-outline",
    accent: "#10b981",
    sections: [
      {
        heading: "Expectations",
        bullets: [
          "Communicate clearly in enquiries & chat",
          "Honor confirmed bookings and contracts",
          "Report suspicious activity to support",
        ],
      },
    ],
  },
  "security-practices": {
    title: "Security",
    subtitle: "How we protect your account and payments.",
    icon: "lock-closed",
    accent: "#0f766e",
    sections: [
      {
        heading: "Measures",
        bullets: [
          "Encrypted connections (HTTPS/TLS)",
          "Secure payment partners (Razorpay)",
          "Role-based access for dashboards",
          "OTP verification for sensitive changes",
        ],
      },
    ],
  },
  "gdpr-information": {
    title: "GDPR information",
    subtitle: "Rights for users in the EU/EEA.",
    icon: "globe-outline",
    accent: "#0369a1",
    sections: [
      {
        heading: "Your rights",
        bullets: [
          "Right to access, rectify and erase data",
          "Right to restrict or object to processing",
          "Right to data portability where applicable",
        ],
      },
      {
        heading: "Contact",
        body: "privacy@tradefairwala.com",
      },
    ],
  },
  "accessibility-statement": {
    title: "Accessibility",
    subtitle: "We're committed to an inclusive experience.",
    icon: "accessibility",
    accent: "#5b21b6",
    sections: [
      {
        heading: "Our approach",
        body: "We design for readable text, sufficient contrast, and screen reader friendly labels across core flows.",
      },
      {
        heading: "Feedback",
        body: "Report accessibility issues via the contact form — we prioritize fixes on booking and entry flows.",
      },
    ],
    cta: { label: "Contact us", route: "/pages/contact" },
  },
  industries: {
    title: "Industries",
    subtitle: "Fairs across sectors — find yours.",
    icon: "grid",
    accent: "#10b981",
    sections: [
      {
        heading: "Popular sectors",
        bullets: [
          "Manufacturing & engineering",
          "Food, agriculture & FMCG",
          "Textiles, footwear & apparel",
          "Technology & electronics",
          "Healthcare & pharma",
          "Auto, transport & logistics",
        ],
      },
      {
        heading: "Browse fairs",
        body: "Use industry filters on the Trade Fairs tab to find events in your sector.",
      },
    ],
    cta: { label: "Browse trade fairs", route: "/(tabs)/trade-fairs" },
  },
};

export function getMarketingPage(slug: string): MarketingPage | null {
  return MARKETING_CONTENT[slug] ?? null;
}
