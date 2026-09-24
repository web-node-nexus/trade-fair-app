import type { EventCategory, PublicEvent } from "@/api/client";

export const MOCK_CATEGORIES: EventCategory[] = [
  { id: 1, name: "Trade & Commerce", slug: "trade-commerce" },
  { id: 2, name: "Technology", slug: "technology" },
  { id: 3, name: "Footwear", slug: "footwear" },
  { id: 4, name: "Agriculture", slug: "agriculture" },
  { id: 5, name: "Healthcare", slug: "healthcare" },
  { id: 6, name: "Food & Beverage", slug: "food-beverage" },
];

export const MOCK_EVENTS: PublicEvent[] = [
  {
    id: "1",
    title: "India Tech & Innovation Expo 2026",
    venueName: "Pragati Maidan",
    venueCity: "Delhi",
    startsAt: "2026-05-22T09:00:00.000Z",
    endsAt: "2026-05-24T18:00:00.000Z",
    categoryId: 2,
    stallCount: 250,
    minStallPrice: 15000,
    rating: 4.8,
    isVerified: true,
  },
  {
    id: "2",
    title: "Global Trade & Commerce Summit",
    venueName: "Bombay Exhibition Centre",
    venueCity: "Mumbai",
    startsAt: "2026-06-10T09:00:00.000Z",
    endsAt: "2026-06-12T18:00:00.000Z",
    categoryId: 1,
    stallCount: 180,
    minStallPrice: 12000,
    rating: 4.6,
    isVerified: true,
  },
  {
    id: "3",
    title: "Organic Agri & Food Expo",
    venueName: "Hitex Exhibition Center",
    venueCity: "Hyderabad",
    startsAt: "2026-07-05T09:00:00.000Z",
    endsAt: "2026-07-07T18:00:00.000Z",
    categoryId: 4,
    stallCount: 120,
    minStallPrice: 8000,
    rating: 4.5,
    isVerified: false,
  },
];

export const INDUSTRY_COLORS = ["#d1fae5", "#dbeafe", "#ffedd5", "#fce7f3", "#e0e7ff", "#fef3c7"];

export const BANNER_COLORS = ["#0f2847", "#0d3d2e", "#3d2a1a", "#1e293b"];
