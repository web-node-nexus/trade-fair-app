export type EventOrganizer = {
  name: string;
  email: string;
  phone: string | null;
  verified?: boolean;
};

export type EventContact = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  roleLabel?: string | null;
};

export type PublicEvent = {
  id: string;
  title: string;
  description?: string | null;
  venueName: string;
  venueCity?: string | null;
  venueState?: string | null;
  venueCountry?: string | null;
  startsAt: string;
  endsAt?: string | null;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  categoryId?: number | null;
  categoryIds?: number[];
  tags?: string[] | null;
  isB2b?: boolean;
  isB2c?: boolean;
  stallCount?: number;
  minStallPrice?: number | null;
  rating?: number | null;
  isVerified?: boolean;
  organizerVerified?: boolean;
  stallBookingEnabled?: boolean;
  isFeatured?: boolean;
  organizer?: EventOrganizer | null;
  contacts?: EventContact[];
};

export type EventCategory = {
  id: number;
  name: string;
  slug: string;
  eventCount?: number;
};

export type HomeBanner = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  active: boolean;
};

export type EventMedia = {
  id: string;
  url: string;
  mediaType: string;
};

export type TicketType = {
  id: string;
  name: string;
  priceMinor: string;
  quota: number;
  soldCount: number;
};

export type VisitorTicket = {
  id: string;
  eventId: string;
  eventTitle: string;
  ticketTypeName: string | null;
  eventStartsAt: string | null;
  venueName: string | null;
  status: string;
  createdAt: string;
  qrPayload: string | null;
};

export type ServiceProviderContact = {
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
};

export type ServiceListing = {
  id: string;
  title: string;
  description?: string | null;
  categoryName?: string | null;
  companyName?: string | null;
  priceMinor?: string | null;
  currency?: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
  serviceArea?: string | null;
  leadTimeDays?: number | null;
  deliveryNotes?: string | null;
  exhibitorRatingAvg?: number | null;
  exhibitorRatingCount?: number;
};

export type EventFilters = {
  search?: string;
  categoryId?: string;
  venueState?: string;
  venueCity?: string;
  dateFrom?: string;
  dateTo?: string;
  b2bOnly?: boolean;
  b2cOnly?: boolean;
  featuredOnly?: boolean;
};
