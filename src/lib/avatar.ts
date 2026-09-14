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
  // Grab the very first letter/character
  const firstWord = cleanName.split(/\s+/)[0];
  const char = firstWord.charAt(0);
  return char ? char.toUpperCase() : 'U';
}

/**
 * Returns Google-style palette style for a given name or seed
 */
export function getAvatarColor(nameOrSeed?: string): { bg: string; text: string } {
  let seed = (nameOrSeed || 'user').trim().toLowerCase();
  if (seed.includes('@')) {
    seed = seed.split('@')[0].trim();
  }
  const index = hashString(seed) % GOOGLE_AVATAR_PALETTE.length;
  return GOOGLE_AVATAR_PALETTE[index];
}

/**
 * Generate a standalone SVG Data URI for an initial avatar
 * Compatible everywhere as an <img> src or CSS background
 */
export function generateGoogleLetterAvatarSvg(nameOrSeed: string, size = 128, colorSeed?: string, isSquircle = true): string {
  const letter = getFirstLetter(nameOrSeed);
  const color = getAvatarColor(nameOrSeed || colorSeed);
  const fontSize = Math.round(size * 0.52);
  const rx = isSquircle ? Math.round(size * 0.22) : Math.round(size / 2);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${rx}" fill="${color.bg}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${color.text}" font-family="-apple-system, BlinkMacSystemFont, 'Google Sans', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="700" font-size="${fontSize}px">${letter}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
