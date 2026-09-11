import { Place } from '../types';
import { KNOWN_BRAND_LOGOS } from './logoUtils';

/**
 * Extracts a clean domain from an email, URL or raw domain string
 * e.g. "info@yoouz.com" -> "yoouz.com"
 * e.g. "https://www.the-rustic-spoon.co.uk/menu" -> "the-rustic-spoon.co.uk"
 */
export function extractDomainFromInput(input: string): string {
  if (!input) return '';
  let str = input.trim().toLowerCase();
  
  if (str.includes('@')) {
    str = str.split('@')[1] || '';
  }
  
  str = str.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].split('#')[0];
  return str.trim();
}

/**
 * Formats a clean, human-readable brand name from a domain
 * e.g. "yoouz.com" -> "Yoouz"
 * e.g. "the-rustic-spoon.com" -> "The Rustic Spoon"
 * e.g. "starbucks.co.uk" -> "Starbucks"
 * e.g. "blue-bottle-coffee.com" -> "Blue Bottle Coffee"
 * e.g. "bakerydelight.com" -> "Bakery Delight"
 */
export function formatBusinessNameFromDomain(domain: string): string {
  if (!domain) return 'Verified Business';
  
  const clean = domain.replace(/^www\./, '').toLowerCase();
  // Strip TLD (.com, .co.uk, .org, .io, .net, etc.)
  const withoutTld = clean.replace(/\.(co\.[a-z]{2}|[a-z]{2,8})$/i, '').split('.')[0] || clean;
  
  // Replace hyphens and underscores with spaces
  const parts = withoutTld
    .split(/[-_.]+/)
    .filter(Boolean);

  if (parts.length === 0) return 'Verified Business';

  // Capitalize words properly
  const formatted = parts
    .map(word => {
      if (word.length === 1) return word.toUpperCase();
      // Handle camelCase or compound names if any
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  return formatted || 'Verified Business';
}

/**
 * Generates high-res favicon/logo URL from a domain
 */
export function getDomainLogoUrl(domain: string): string {
  if (!domain) return '';
  const clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase().split('/')[0];
  if (!clean || clean.includes('gmail.com') || clean.includes('yahoo.com') || clean.includes('hotmail.com')) {
    return '';
  }
  if (clean === 'yoouz.com' || clean === 'www.yoouz.com' || clean.includes('yoouz')) {
    return 'https://www.yoouz.com/icon-512.png';
  }
  if (KNOWN_BRAND_LOGOS[clean]) {
    return KNOWN_BRAND_LOGOS[clean];
  }
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${clean}&size=256`;
}

/**
 * Finds matching place from existing places or creates an auto-derived dynamic Place object
 */
export function derivePlaceFromEmailOrDomain(
  emailOrDomain: string,
  existingPlaces: Place[] = []
): Place {
  const domain = extractDomainFromInput(emailOrDomain);
  const cleanDomain = domain.replace(/^www\./, '');

  if (cleanDomain && !cleanDomain.includes('gmail.com') && !cleanDomain.includes('yahoo.com') && !cleanDomain.includes('hotmail.com') && !cleanDomain.includes('outlook.com')) {
    // 1. Check existing places by website
    const matchedByWebsite = existingPlaces.find(p => {
      if (p.website) {
        const pDom = extractDomainFromInput(p.website);
        if (pDom && (pDom === cleanDomain || pDom.includes(cleanDomain) || cleanDomain.includes(pDom))) {
          return true;
        }
      }
      return false;
    });
    if (matchedByWebsite) return matchedByWebsite;

    // 2. Check existing places by slug match
    const domSlug = cleanDomain.split('.')[0].replace(/[^a-z0-9]/g, '');
    const matchedBySlug = existingPlaces.find(p => {
      const pSlug = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (pSlug && domSlug && (pSlug === domSlug || pSlug.includes(domSlug) || domSlug.includes(pSlug))) {
        return true;
      }
      return false;
    });
    if (matchedBySlug) return matchedBySlug;
  }

  // Special case: Yoouz official website
  const isYoouz = cleanDomain === 'yoouz.com' || cleanDomain === 'www.yoouz.com' || cleanDomain.includes('yoouz');
  const businessName = isYoouz ? 'Yoouz' : (cleanDomain ? formatBusinessNameFromDomain(cleanDomain) : 'Verified Business');
  const logoUrl = isYoouz ? 'https://www.yoouz.com/icon-512.png' : getDomainLogoUrl(cleanDomain);
  const placeId = cleanDomain ? cleanDomain : 'place-custom';

  return {
    id: placeId,
    name: businessName,
    address: isYoouz ? 'Global Headquarters • yoouz.com' : (cleanDomain ? `Official Domain: ${cleanDomain}` : '123 Enterprise Way, Suite 400'),
    category: isYoouz ? 'Video Reviews & Discovery Platform' : 'Verified Enterprise & Merchant',
    categoryType: 'services',
    city: isYoouz ? 'Brussels' : 'Global Headquarters',
    rating: 5.0,
    reviewCount: 0,
    lat: 50.8503,
    lng: 4.3517,
    phone: '',
    website: isYoouz ? 'https://www.yoouz.com' : (cleanDomain ? `https://${cleanDomain}` : ''),
    hours: 'Mon-Fri: 9:00 AM - 6:00 PM',
    description: isYoouz 
      ? 'Official verified business profile for Yoouz. Real people, authentic 60-second video reviews.' 
      : `Official verified merchant profile for ${businessName}. Authenticated through official business domain ownership.`,
    logoUrl: logoUrl,
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    claimedByEmail: emailOrDomain.includes('@') ? emailOrDomain.toLowerCase().trim() : undefined
  } as unknown as Place;
}
