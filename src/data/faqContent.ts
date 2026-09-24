export type FaqItem = { question: string; answer: string };
export type FaqSection = { title: string; items: FaqItem[] };

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "General Questions",
    items: [
      {
        question: "What is Trade Fair Wala?",
        answer:
          "Trade Fair Wala is a marketplace platform that connects Exhibition Organizers, Exhibitors, Visitors, and Service Providers. Users can discover trade fairs, register, book stalls or tickets, and hire booth services through one platform.",
      },
      {
        question: "Who can use Trade Fair Wala?",
        answer:
          "Event Organizers, Exhibitors, Visitors, Service Providers, business buyers & sellers, and industry associations can all use the platform.",
      },
      {
        question: "Is Trade Fair Wala available on mobile?",
        answer: "Yes. Use this app on your phone — browse fairs, book stalls, and manage your workspace.",
      },
      {
        question: "Is registration free?",
        answer:
          "Basic registration is free. Premium services, featured listings, or subscriptions may require payment depending on your role and plan.",
      },
    ],
  },
  {
    title: "For Organizers",
    items: [
      {
        question: "How can I list my exhibition?",
        answer: "Create an Organizer account, complete KYC, and submit event details from the Organizer Dashboard.",
      },
      {
        question: "Can I sell exhibitor spaces?",
        answer: "Yes. Publish stalls, booth types, sponsorship packages, and manage bookings from your event workspace.",
      },
      {
        question: "Can I manage visitor registrations?",
        answer:
          "Yes. Offer free registration, sell visitor tickets, approve visitors manually, or allow direct entry with QR passes.",
      },
      {
        question: "Why is my published fair hidden from the homepage?",
        answer:
          "Published fairs only appear on the homepage while the end date is still in the future. Edit the event and set a future end date to restore visibility.",
      },
    ],
  },
  {
    title: "For Exhibitors",
    items: [
      {
        question: "How do I book a stall?",
        answer:
          "Browse published fairs, open the event page, pick a stall on the floor map, and complete checkout. Some fairs require organizer approval.",
      },
      {
        question: "Can I hire service providers for my booth?",
        answer:
          "Yes. Use the Marketplace to send enquiries, negotiate in chat, send service contracts, and pay for confirmed bookings.",
      },
      {
        question: "How do contracts work?",
        answer:
          "After chatting with a provider, you send a contract with duration and scope. The provider accepts with manpower and equipment details — then the deal is confirmed.",
      },
    ],
  },
  {
    title: "For Visitors",
    items: [
      {
        question: "How do I get my entry pass?",
        answer: "Book a visitor ticket for a fair. Your QR pass appears under My Passes — show it at the gate for entry.",
      },
      {
        question: "Can I get a refund?",
        answer: "Refund rules depend on the organizer and ticket type. Open a support ticket under Billing or Ticket booking if you need help.",
      },
    ],
  },
  {
    title: "For Service Providers",
    items: [
      {
        question: "How do I list my services?",
        answer:
          "Complete provider KYC, create service listings with photos and pricing, and publish them to receive exhibitor enquiries.",
      },
      {
        question: "How do I accept a contract?",
        answer:
          "When an exhibitor sends a contract, open the enquiry chat, fill manpower and machinery details, and tap Accept contract.",
      },
    ],
  },
  {
    title: "Payments & Support",
    items: [
      {
        question: "Which payment methods are supported?",
        answer: "Online payments are processed securely via Razorpay for tickets, stall bookings, and marketplace services.",
      },
      {
        question: "How do I contact support?",
        answer:
          "Open Support from your role dashboard, create a ticket with the right category (technical, billing, stall booking, etc.), and attach files if needed.",
      },
    ],
  },
];
