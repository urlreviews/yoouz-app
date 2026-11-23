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
 */
export function normalizeAvatarSeed(input?: string): string {
  if (!input || typeof input !== 'string') return 'user';
  let str = input.trim().toLowerCase();
  if (str.startsWith('@')) str = str.substring(1);
  if (str.includes('@')) str = str.split('@')[0].trim();
  
  // Clean alphanumeric characters
  const clean = str.replace(/[^a-z0-9]/g, '');
  if (!clean) return 'user';

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

  const index = hashString(seed) % GOOGLE_AVATAR_PALETTE.length;
  return GOOGLE_AVATAR_PALETTE[index];
}

/**
 * Generate a standalone SVG Data URI for an initial avatar
 * Compatible everywhere as an <img> src or CSS background.
 * Always renders a full-square (no embedded rx) so CSS border-radius applies smoothly.
 */
export function generateGoogleLetterAvatarSvg(nameOrSeed: string, size = 128, colorSeed?: string): string {
  const nameClean = (nameOrSeed || '').toLowerCase().trim().replace(/^@/, '');
  const isBrandYoouz = nameClean === 'yoouz' || nameClean === 'yoouz.com' || nameClean === 'yoouz beta' || nameClean === 'a yoouz member' || nameClean === 'yoouz member';
  if (isBrandYoouz) {
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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '').trim();
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) {
    return { r: 94, g: 114, b: 148 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export interface AdaptiveBannerPalette {
  accentHex: string;
  baseColor: string;
  backgroundImage: string;
  previewBackgroundImage: string;
  borderTint: string;
}

/**
 * Generates an Apple Contact Poster / Google Material You inspired
 * obsidian studio gradient derived deterministically from the user's avatar color.
 */
export function getAdaptiveBannerPalette(nameOrSeed?: string, colorSeed?: string): AdaptiveBannerPalette {
  const avatarColor = getAvatarColor(nameOrSeed, colorSeed);
  const { r, g, b } = hexToRgb(avatarColor.bg);

  // Lift for dark OLED studio luminance so deeper hues (brown, indigo) feel rich and intentional
  const hiR = Math.min(255, Math.round(r + (255 - r) * 0.30));
  const hiG = Math.min(255, Math.round(g + (255 - g) * 0.30));
  const hiB = Math.min(255, Math.round(b + (255 - b) * 0.30));

  const deepR = Math.round(r * 0.52);
  const deepG = Math.round(g * 0.52);
  const deepB = Math.round(b * 0.52);

  const baseRgb = `${r}, ${g}, ${b}`;
  const hiRgb = `${hiR}, ${hiG}, ${hiB}`;
  const deepRgb = `${deepR}, ${deepG}, ${deepB}`;

  const backgroundImage = [
    `linear-gradient(180deg, rgba(5, 5, 6, 0.04) 0%, rgba(5, 5, 6, 0.16) 58%, #050506 100%)`,
    `radial-gradient(ellipse 88% 120% at 20% 22%, rgba(${hiRgb}, 0.72) 0%, rgba(${baseRgb}, 0.38) 46%, transparent 78%)`,
    `radial-gradient(circle at 86% 18%, rgba(${hiRgb}, 0.42) 0%, rgba(${baseRgb}, 0.20) 46%, transparent 74%)`,
    `radial-gradient(ellipse 75% 44% at 50% -14%, rgba(255, 255, 255, 0.16) 0%, transparent 66%)`,
    `linear-gradient(155deg, rgba(${baseRgb}, 0.56) 0%, rgba(${deepRgb}, 0.34) 55%, #050506 100%)`,
  ].join(', ');

  const previewBackgroundImage = [
    `linear-gradient(180deg, rgba(5, 5, 6, 0.02) 0%, rgba(5, 5, 6, 0.34) 100%)`,
    `radial-gradient(ellipse 88% 125% at 22% 24%, rgba(${hiRgb}, 0.70) 0%, rgba(${baseRgb}, 0.36) 48%, transparent 80%)`,
    `radial-gradient(circle at 84% 22%, rgba(${hiRgb}, 0.44) 0%, rgba(${baseRgb}, 0.20) 46%, transparent 74%)`,
    `radial-gradient(ellipse 72% 46% at 50% -12%, rgba(255, 255, 255, 0.16) 0%, transparent 66%)`,
    `linear-gradient(155deg, rgba(${baseRgb}, 0.54) 0%, rgba(${deepRgb}, 0.32) 60%, #09090D 100%)`,
  ].join(', ');

  return {
    accentHex: avatarColor.bg,
    baseColor: '#07070A',
    backgroundImage,
    previewBackgroundImage,
    borderTint: `rgba(${hiRgb}, 0.36)`,
  };
}

