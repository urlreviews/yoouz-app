import { YOOUZ_LOGO_DATA_URI } from "../utils/logoUtils";

/**
 * Deterministic, Google-style single-letter avatar generator
 * Uses the first letter of the user's first name with a vibrant, distinct color background.
 */

// Google-inspired vibrant, accessible avatar palette
export const GOOGLE_AVATAR_PALETTE = [
  { bg: '#E53935', text: '#FFFFFF', name: 'red' },       // Material Red 600
  { bg: '#D81B60', text: '#FFFFFF', name: 'pink' },      // Material Pink 600
  { bg: '#8E24AA', text: '#FFFFFF', name: 'purple' },    // Material Purple 600
  { bg: '#5E35B1', text: '#FFFFFF', name: 'deepPurple' },// Deep Purple 600
  { bg: '#3949AB', text: '#FFFFFF', name: 'indigo' },    // Indigo 600
  { bg: '#1E88E5', text: '#FFFFFF', name: 'blue' },      // Blue 600
  { bg: '#039BE5', text: '#FFFFFF', name: 'lightBlue' }, // Light Blue 600
  { bg: '#00ACC1', text: '#FFFFFF', name: 'cyan' },      // Cyan 600
  { bg: '#00897B', text: '#FFFFFF', name: 'teal' },      // Teal 600
  { bg: '#43A047', text: '#FFFFFF', name: 'green' },     // Green 600
  { bg: '#7CB342', text: '#FFFFFF', name: 'lightGreen' },// Light Green 600
  { bg: '#FB8C00', text: '#FFFFFF', name: 'orange' },    // Orange 600
  { bg: '#F4511E', text: '#FFFFFF', name: 'deepOrange' },// Deep Orange 600
  { bg: '#6D4C41', text: '#FFFFFF', name: 'brown' },     // Brown 600
  { bg: '#546E7A', text: '#FFFFFF', name: 'blueGrey' },  // Blue Grey 600
];

/**
 * Hash a string to select a deterministic color index from the palette
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Extracts the single first letter from the user's first name
 */
export function getFirstLetter(nameOrEmail?: string): string {
  if (!nameOrEmail || typeof nameOrEmail !== 'string') return 'U';
  const trimmed = nameOrEmail.trim();
  if (!trimmed) return 'U';

  // If email was passed, take part before @
  const cleanName = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  // If handle was passed with leading @
  const handleClean = cleanName.startsWith('@') ? cleanName.substring(1) : cleanName;
  // Grab the very first letter/character
  const firstWord = handleClean.split(/\s+/)[0];
  const char = firstWord.charAt(0);
  return char ? char.toUpperCase() : 'U';
}

/**
 * Normalizes any user identifier (Name, Handle, Email, User ID) into a canonical seed string.
 * E.g. "Steven Akan", "Steven", "@stevenakan", "stevenakan", "avr6566gd@gmail.com" all normalize to "stevenakan".
 * "Ben Blue", "Ben", "@benblue", "benblue", "aouisesmee@gmail.com" all normalize to "benblue".
 */
export function normalizeAvatarSeed(input?: string): string {
  if (!input || typeof input !== 'string') return 'user';
  let str = input.trim().toLowerCase();
  if (str.startsWith('@')) str = str.substring(1);
  if (str.includes('@')) str = str.split('@')[0].trim();
  
  // Clean alphanumeric characters
  const clean = str.replace(/[^a-z0-9]/g, '');
  if (!clean) return 'user';

  // Canonical clusters for known community reviewer identities
  if (
    clean === 'stevenakan' ||
    clean === 'steven' ||
    clean === 'avr6566gd' ||
    clean === 'steven_akan' ||
    clean.includes('stevenakan') ||
    clean === 'avtertuop'
  ) {
    return 'stevenakan';
  }

  if (
    clean === 'benblue' ||
    clean === 'ben' ||
    clean.includes('aouisesmee') ||
    clean.includes('aouisemee') ||
    clean.includes('aouisesme')
  ) {
    return 'benblue';
  }

  if (
    clean === 'bizriv' ||
    clean.includes('louis42111')
  ) {
    return 'bizriv';
  }

  return clean;
}

/**
 * Returns Google-style palette style for a given name, handle or seed.
 * Prioritizes colorSeed (e.g. handle/email/id) when available for 100% stable color parity.
 */
export function getAvatarColor(nameOrSeed?: string, colorSeed?: string): { bg: string; text: string; name: string } {
  let seed = 'user';
  if (colorSeed && colorSeed.trim() !== '' && colorSeed !== 'user') {
    seed = normalizeAvatarSeed(colorSeed);
  } else if (nameOrSeed && nameOrSeed.trim() !== '') {
    seed = normalizeAvatarSeed(nameOrSeed);
  }

  // Exact canonical colors for known personas
  if (seed === 'benblue') {
    return { bg: '#1E88E5', text: '#FFFFFF', name: 'blue' }; // Material Blue 600
  }
  if (seed === 'stevenakan') {
    return { bg: '#7CB342', text: '#FFFFFF', name: 'lightGreen' }; // Material Light Green 600
  }
  if (seed === 'bizriv') {
    return { bg: '#8E24AA', text: '#FFFFFF', name: 'purple' }; // Material Purple 600
  }

  const index = hashString(seed) % GOOGLE_AVATAR_PALETTE.length;
  return GOOGLE_AVATAR_PALETTE[index];
}

/**
 * Generate a standalone SVG Data URI for an initial avatar
 * Compatible everywhere as an <img> src or CSS background.
 * Always renders a full-square (no embedded rx) so CSS border-radius applies smoothly.
 */
export function generateGoogleLetterAvatarSvg(nameOrSeed: string, size = 128, colorSeed?: string): string {
  const norm = (nameOrSeed || colorSeed || '').toLowerCase().trim().replace(/^@/, '');
  if (norm === 'yoouz' || norm === 'yoouz.com' || norm === 'yoouz beta' || norm.includes('yoouz')) {
    return YOOUZ_LOGO_DATA_URI;
  }

  const letter = getFirstLetter(nameOrSeed || colorSeed);
  const color = getAvatarColor(nameOrSeed, colorSeed);
  const fontSize = Math.round(size * 0.52);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${color.bg}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${color.text}" font-family="-apple-system, BlinkMacSystemFont, 'Google Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}px">${letter}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
