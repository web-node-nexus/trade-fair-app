import type { EventCategory, EventFilters, HomeBanner, PublicEvent, ServiceListing } from "./types";
import { getResolvedApiBase } from "@/lib/apiBase";
import { filterUpcomingEvents } from "@/utils/eventDates";

const API_BASE = getResolvedApiBase();

export type { PublicEvent, EventCategory, HomeBanner, EventFilters, ServiceListing } from "./types";

async function apiJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export function getApiBaseUrl(): string {
  return API_BASE;
}

export async function fetchCategories(): Promise<EventCategory[]> {
  try {
    const data = await apiJson<{ categories: EventCategory[] }>("/events/categories");
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function fetchVenueCities(): Promise<string[]> {
  try {
    const data = await apiJson<{ cities: string[] }>("/events/cities");
    return data.cities ?? [];
  } catch {
    return [];
  }
}

export async function fetchHomeBanners(): Promise<HomeBanner[]> {
  try {
    const data = await apiJson<{ banners: HomeBanner[] }>("/home-banners");
    return (data.banners ?? []).filter((b) => b.active !== false);
  } catch {
    return [];
  }
}

function buildEventsQuery(filters?: EventFilters): string {
  const q = new URLSearchParams();
  if (filters?.search?.trim()) q.set("search", filters.search.trim());
  if (filters?.categoryId) q.set("categoryId", filters.categoryId);
  if (filters?.venueState?.trim()) q.set("venueState", filters.venueState.trim());
  if (filters?.venueCity?.trim()) q.set("venueCity", filters.venueCity.trim());
  if (filters?.dateFrom) q.set("dateFrom", filters.dateFrom);
  if (filters?.dateTo) q.set("dateTo", filters.dateTo);
  if (filters?.b2bOnly) q.set("b2bOnly", "1");
  if (filters?.b2cOnly) q.set("b2cOnly", "1");
  if (filters?.featuredOnly) q.set("featured", "1");
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchEvents(filters?: EventFilters): Promise<PublicEvent[]> {
  try {
    const data = await apiJson<{ events: PublicEvent[] }>(`/events${buildEventsQuery(filters)}`);
    return filterUpcomingEvents(data.events ?? []);
  } catch {
    return [];
  }
}

export async function fetchFeaturedEvents(): Promise<PublicEvent[]> {
  return fetchEvents({ featuredOnly: true });
}

export type ServiceCategory = { id: number; name: string; slug?: string };

export async function fetchServiceCategories(): Promise<ServiceCategory[]> {
  try {
    const data = await apiJson<{ categories: ServiceCategory[] }>("/service-categories");
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function fetchServices(): Promise<ServiceListing[]> {
  try {
    const data = await apiJson<{ services: ServiceListing[] }>("/services");
    return data.services ?? [];
  } catch {
    return [];
  }
}
