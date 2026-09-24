export const COUNTRIES = ["India", "United Arab Emirates", "Singapore", "United States", "United Kingdom"] as const;

export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const CITIES_BY_STATE: Record<string, string[]> = {
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  Assam: ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Tezpur"],
  Bihar: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
  Chhattisgarh: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
  Delhi: ["Delhi", "New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  Goa: ["Panaji", "Margao", "Vasco da Gama", "Mapusa"],
  Gujarat: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  Haryana: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Solan", "Mandi"],
  Jharkhand: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
  Karnataka: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
  Kerala: ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad"],
  Manipur: ["Imphal", "Thoubal", "Bishnupur"],
  Meghalaya: ["Shillong", "Tura", "Jowai"],
  Mizoram: ["Aizawl", "Lunglei", "Champhai"],
  Nagaland: ["Kohima", "Dimapur", "Mokokchung"],
  Odisha: ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
  Punjab: ["Chandigarh", "Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
  Rajasthan: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  Sikkim: ["Gangtok", "Namchi", "Gyalshing"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  Telangana: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar"],
  Tripura: ["Agartala", "Udaipur", "Dharmanagar"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Varanasi", "Agra"],
  Uttarakhand: ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
};

/** Always pinned at the top of city filters (order matters). */
export const PINNED_FILTER_CITIES: Array<{ label: string; value: string }> = [
  { label: "Delhi", value: "Delhi" },
  { label: "Mumbai", value: "Mumbai" },
  { label: "Pune", value: "Pune" },
  { label: "Lucknow", value: "Lucknow" },
  { label: "Bangalore", value: "Bengaluru" },
  { label: "Gurugram", value: "Gurugram" },
];

export const ORGANIZATION_TYPES = [
  { value: "event_organizer", label: "Event Organizer" },
  { value: "trade_association", label: "Trade Association" },
  { value: "government_body", label: "Government Body" },
  { value: "chamber_of_commerce", label: "Chamber of Commerce" },
  { value: "other", label: "Other" },
] as const;

export const BUSINESS_CATEGORIES = [
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "services", label: "Services" },
  { value: "startup", label: "Startup" },
  { value: "other", label: "Other" },
] as const;

/** Product lines exhibitors showcase — aligned with trade-fair filter categories. */
export const PRODUCT_CATEGORIES = [
  { value: "agriculture", label: "Agriculture" },
  { value: "automobile-ev", label: "Automobile & EV" },
  { value: "beauty-wellness", label: "Beauty & Wellness" },
  { value: "construction-building-materials", label: "Construction & Building Materials" },
  { value: "education-training", label: "Education & Training" },
  { value: "electronics-technology", label: "Electronics & Technology" },
  { value: "food-beverage", label: "Food & Beverage" },
  { value: "furniture-home-decor", label: "Furniture & Home Decor" },
  { value: "gifts-handicrafts-handlooms", label: "Gifts, Handicrafts & Handlooms" },
  { value: "healthcare-medical", label: "Healthcare & Medical" },
  { value: "industrial-machinery", label: "Industrial Machinery" },
  { value: "interior-architecture", label: "Interior & Architecture" },
  { value: "jewellery-gems", label: "Jewellery & Gems" },
  { value: "kitchenware-houseware", label: "Kitchenware & Houseware" },
  { value: "footwear", label: "Footwear" },
  { value: "logistics-packaging", label: "Logistics & Packaging" },
  { value: "renewable-energy", label: "Renewable Energy" },
  { value: "textiles-apparel", label: "Textiles & Apparel" },
  { value: "franchise-business-services", label: "Franchise & Business Services" },
  { value: "others", label: "Others" },
] as const;

export function productCategoryLabel(value: string): string {
  const hit = PRODUCT_CATEGORIES.find((c) => c.value === value);
  if (hit) return hit.label;
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const SERVICE_OFFERINGS = [
  { value: "stall_fabrication", label: "Stall Fabrication" },
  { value: "printing_branding", label: "Printing & Branding" },
  { value: "hostess_promoters", label: "Hostess & Promoters" },
  { value: "catering", label: "Catering" },
  { value: "audio_visual", label: "Audio Visual" },
  { value: "photography", label: "Photography" },
  { value: "security", label: "Security" },
  { value: "logistics", label: "Logistics" },
  { value: "digital_marketing", label: "Digital Marketing" },
  { value: "other", label: "Other" },
] as const;

export const INDUSTRY_INTERESTS = [
  { value: "agriculture", label: "Agriculture" },
  { value: "automobile", label: "Automobile" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "technology", label: "Technology" },
  { value: "real_estate", label: "Real Estate" },
  { value: "others", label: "Others" },
] as const;

export function citiesForState(state: string): string[] {
  return CITIES_BY_STATE[state] ?? [];
}

function normalizeCityKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** All cities from the India location catalogue (deduped). */
export function allIndianCitiesFlat(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const cities of Object.values(CITIES_BY_STATE)) {
    for (const city of cities) {
      const key = normalizeCityKey(city);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(city);
    }
  }
  return out;
}

/**
 * City filter options: pinned cities first, then remaining Indian cities A–Z.
 * Extra API cities (from events) are merged into the rest list.
 */
export function buildPinnedCityOptions(extraCities: string[] = []): {
  pinned: Array<{ label: string; value: string }>;
  rest: string[];
  /** Flat list for pickers: pinned values first, then rest. */
  all: string[];
} {
  const pinnedKeys = new Set(PINNED_FILTER_CITIES.map((c) => normalizeCityKey(c.value)));
  // Also treat Bangalore ↔ Bengaluru as pinned so duplicates don't appear in rest
  pinnedKeys.add(normalizeCityKey("Bangalore"));
  pinnedKeys.add(normalizeCityKey("Bengaluru"));

  const restKeys = new Set<string>();
  const keyToLabel = new Map<string, string>();

  for (const city of [...allIndianCitiesFlat(), ...extraCities]) {
    const trimmed = city.trim();
    if (!trimmed) continue;
    const key = normalizeCityKey(trimmed);
    keyToLabel.set(key, trimmed);
    if (pinnedKeys.has(key)) continue;
    restKeys.add(key);
  }

  const rest = [...restKeys]
    .map((key) => keyToLabel.get(key) ?? key)
    .sort((a, b) => a.localeCompare(b, "en-IN"));

  const pinned = PINNED_FILTER_CITIES.map((c) => ({ ...c }));
  return {
    pinned,
    rest,
    all: [...pinned.map((c) => c.value), ...rest],
  };
}

/** Labels for popular city chips (pinned order). */
export function pinnedCityLabels(): string[] {
  return PINNED_FILTER_CITIES.map((c) => c.label);
}
