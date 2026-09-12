export interface PartnerAgency {
  id: string;
  name: string;
  city: string;
  country: string;
  contactEmail: string;
  contactPhone: string;
  accountManager: string;
  commissionRate: number; // e.g. 35%
  managedPlacesCount: number;
  verifiedBadge: boolean;
  specialty: string;
}

export const VERIFIED_PARTNER_AGENCIES: PartnerAgency[] = [
  {
    id: 'agency_global_direct',
    name: 'Yoouz Partner Network (Direct)',
    city: 'Global Concierge',
    country: 'International',
    contactEmail: 'partners@yoouz.com',
    contactPhone: '+1 (800) 592-9689',
    accountManager: 'Alex Vance (Global Lead)',
    commissionRate: 0,
    managedPlacesCount: 42,
    verifiedBadge: true,
    specialty: 'Direct Platform Concierge & Multi-Location Accounts'
  },
  {
    id: 'agency_london_apex',
    name: 'Apex Hospitality Media',
    city: 'London',
    country: 'United Kingdom',
    contactEmail: 'onboarding@apexmedia.co.uk',
    contactPhone: '+44 20 7946 0192',
    accountManager: 'James Sterling',
    commissionRate: 35,
    managedPlacesCount: 18,
    verifiedBadge: true,
    specialty: 'Restaurants, Boutique Hotels & High-End Salons'
  },
  {
    id: 'agency_ny_manhattan',
    name: 'Manhattan Local Reps & SEO',
    city: 'New York',
    country: 'United States',
    contactEmail: 'merchants@manhattanlocal.io',
    contactPhone: '+1 (212) 555-0143',
    accountManager: 'Sarah Jenkins',
    commissionRate: 30,
    managedPlacesCount: 24,
    verifiedBadge: true,
    specialty: 'Bars, Cafes, Dining & Entertainment Venues'
  },
  {
    id: 'agency_istanbul_digital',
    name: 'Bosphorus Brand & Video Lab',
    city: 'Istanbul',
    country: 'Turkey',
    contactEmail: 'destek@bosphorusdigital.com',
    contactPhone: '+90 212 340 8820',
    accountManager: 'Emre Karahan',
    commissionRate: 40,
    managedPlacesCount: 15,
    verifiedBadge: true,
    specialty: 'Gastronomy, Turkish Riviera & Lifestyle Venues'
  },
  {
    id: 'agency_berlin_growth',
    name: 'Mitte Creative Agency',
    city: 'Berlin',
    country: 'Germany',
    contactEmail: 'hello@mittecreative.de',
    contactPhone: '+49 30 901820',
    accountManager: 'Lukas Weber',
    commissionRate: 30,
    managedPlacesCount: 11,
    verifiedBadge: true,
    specialty: 'Artisan Dining, Nightlife & Modern Retail'
  },
  {
    id: 'agency_dubai_elite',
    name: 'Emirates Pulse Marketing',
    city: 'Dubai',
    country: 'United Arab Emirates',
    contactEmail: 'vip@emiratespulse.ae',
    contactPhone: '+971 4 362 7000',
    accountManager: 'Tariq Al-Mansoor',
    commissionRate: 35,
    managedPlacesCount: 19,
    verifiedBadge: true,
    specialty: 'Luxury Dining, Beach Clubs & Spas'
  }
];

export function getAgencyById(id?: string): PartnerAgency {
  const found = VERIFIED_PARTNER_AGENCIES.find(a => a.id === id);
  return found || VERIFIED_PARTNER_AGENCIES[0];
}
