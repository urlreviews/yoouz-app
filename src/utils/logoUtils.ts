import { Place } from "../types";

// High-fidelity vector logos for verified businesses
export const KNOWN_BRAND_LOGOS: Record<string, string> = {
  "yoouz.com": "https://www.yoouz.com/icon-512.png",
  "www.yoouz.com": "https://www.yoouz.com/icon-512.png",
  "zoom.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#2D8CFF"/>
      <path d="M24 38 C24 33.58 27.58 30 32 30 H52 C56.42 30 60 33.58 60 38 V62 C60 66.42 56.42 70 52 70 H32 C27.58 70 24 66.42 24 62 Z" fill="#ffffff"/>
      <path d="M64 43.5 L74 36 C75.5 35 77 36 77 38 V62 C77 64 75.5 65 74 64 L64 56.5 Z" fill="#ffffff"/>
    </svg>`),
  "www.zoom.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#2D8CFF"/>
      <path d="M24 38 C24 33.58 27.58 30 32 30 H52 C56.42 30 60 33.58 60 38 V62 C60 66.42 56.42 70 52 70 H32 C27.58 70 24 66.42 24 62 Z" fill="#ffffff"/>
      <path d="M64 43.5 L74 36 C75.5 35 77 36 77 38 V62 C77 64 75.5 65 74 64 L64 56.5 Z" fill="#ffffff"/>
    </svg>`),
  "zoom.us": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#2D8CFF"/>
      <path d="M24 38 C24 33.58 27.58 30 32 30 H52 C56.42 30 60 33.58 60 38 V62 C60 66.42 56.42 70 52 70 H32 C27.58 70 24 66.42 24 62 Z" fill="#ffffff"/>
      <path d="M64 43.5 L74 36 C75.5 35 77 36 77 38 V62 C77 64 75.5 65 74 64 L64 56.5 Z" fill="#ffffff"/>
    </svg>`),
  "www.zoom.us": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#2D8CFF"/>
      <path d="M24 38 C24 33.58 27.58 30 32 30 H52 C56.42 30 60 33.58 60 38 V62 C60 66.42 56.42 70 52 70 H32 C27.58 70 24 66.42 24 62 Z" fill="#ffffff"/>
      <path d="M64 43.5 L74 36 C75.5 35 77 36 77 38 V62 C77 64 75.5 65 74 64 L64 56.5 Z" fill="#ffffff"/>
    </svg>`),
  "facebook.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#1877f2"/>
      <path d="M62 50 H52 V42 C52 38 54 36 58 36 H63 V24 H52 C41 24 37 31 37 41 V50 H28 V62 H37 V96 H52 V62 H61 L62 50 Z" fill="#ffffff"/>
    </svg>`),
  "www.facebook.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="22" fill="#1877f2"/>
      <path d="M62 50 H52 V42 C52 38 54 36 58 36 H63 V24 H52 C41 24 37 31 37 41 V50 H28 V62 H37 V96 H52 V62 H61 L62 50 Z" fill="#ffffff"/>
    </svg>`),
  "reddit.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#FF4500"/>
      <circle cx="50" cy="56" r="23" fill="#FFFFFF"/>
      <circle cx="41" cy="54" r="4.5" fill="#FF4500"/>
      <circle cx="59" cy="54" r="4.5" fill="#FF4500"/>
      <path d="M 42 65 Q 50 71 58 65" stroke="#FF4500" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="25" cy="54" r="5.5" fill="#FFFFFF"/>
      <circle cx="75" cy="54" r="5.5" fill="#FFFFFF"/>
      <circle cx="67" cy="24" r="4.5" fill="#FFFFFF"/>
      <path d="M 50 33 L 56 22 L 65 24" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`),
  "www.reddit.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#FF4500"/>
      <circle cx="50" cy="56" r="23" fill="#FFFFFF"/>
      <circle cx="41" cy="54" r="4.5" fill="#FF4500"/>
      <circle cx="59" cy="54" r="4.5" fill="#FF4500"/>
      <path d="M 42 65 Q 50 71 58 65" stroke="#FF4500" stroke-width="3" stroke-linecap="round" fill="none"/>
      <circle cx="25" cy="54" r="5.5" fill="#FFFFFF"/>
      <circle cx="75" cy="54" r="5.5" fill="#FFFFFF"/>
      <circle cx="67" cy="24" r="4.5" fill="#FFFFFF"/>
      <path d="M 50 33 L 56 22 L 65 24" stroke="#FFFFFF" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`),
  "uber.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#000000"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="1">UBER</text>
    </svg>`),
  "www.uber.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#000000"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="1">UBER</text>
    </svg>`),
  "spotify.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#1DB954"/>
      <path d="M28 40 C44 35 62 38 74 44 M30 52 C44 47 58 50 69 55 M33 64 C43 60 54 62 64 66" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
    </svg>`),
  "www.spotify.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="#1DB954"/>
      <path d="M28 40 C44 35 62 38 74 44 M30 52 C44 47 58 50 69 55 M33 64 C43 60 54 62 64 66" fill="none" stroke="#000000" stroke-width="6" stroke-linecap="round"/>
    </svg>`),
  "usa.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0A2540"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#E63946" stroke-width="3"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">USA</text>
    </svg>`),
  "www.usa.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0A2540"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#E63946" stroke-width="3"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="#ffffff" text-anchor="middle" letter-spacing="1.5">USA</text>
    </svg>`),
  "midtownwellness.co.uk": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <g fill="#f4f4f5">
        <rect x="22" y="24" width="6" height="52" rx="3"/>
        <rect x="34" y="32" width="6" height="44" rx="3"/>
        <rect x="46" y="20" width="6" height="60" rx="3"/>
        <rect x="58" y="32" width="6" height="44" rx="3"/>
        <rect x="70" y="24" width="6" height="52" rx="3"/>
      </g>
    </svg>`),
  "coventgardenmassage.co.uk": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <g fill="#f4f4f5">
        <rect x="22" y="24" width="6" height="52" rx="3"/>
        <rect x="34" y="32" width="6" height="44" rx="3"/>
        <rect x="46" y="20" width="6" height="60" rx="3"/>
        <rect x="58" y="32" width="6" height="44" rx="3"/>
        <rect x="70" y="24" width="6" height="52" rx="3"/>
      </g>
    </svg>`),
  "spaandmassage.co.uk": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#292524"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#d97706" stroke-width="3"/>
      <path d="M50 24 C45 32 36 40 36 50 C36 60 42 66 50 72 C58 66 64 60 64 50 C64 40 55 32 50 24 Z" fill="#f59e0b"/>
      <circle cx="50" cy="46" r="6" fill="#fef3c7"/>
    </svg>`),
  "latakiano.be": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" stroke-width="2.5"/>
      <text x="50" y="58" font-family="'Playfair Display', serif" font-weight="bold" font-size="34" fill="#facc15" text-anchor="middle">LB</text>
      <path d="M38 70 Q50 64 62 70" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`),
  "latakianobarbero.be": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" stroke-width="2.5"/>
      <text x="50" y="58" font-family="'Playfair Display', serif" font-weight="bold" font-size="34" fill="#facc15" text-anchor="middle">LB</text>
      <path d="M38 70 Q50 64 62 70" stroke="#facc15" stroke-width="2" fill="none" stroke-linecap="round"/>
    </svg>`),
  "bpost.be": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#dc2626"/>
      <circle cx="50" cy="50" r="32" fill="#ffffff"/>
      <path d="M38 38 H52 C58 38 62 42 62 48 C62 54 58 58 52 58 H44 V68 H38 V38 Z" fill="#dc2626"/>
      <circle cx="50" cy="48" r="4" fill="#ffffff"/>
    </svg>`),
  "bol.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0000a4"/>
      <text x="46" y="58" font-family="Arial, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle">bol.</text>
      <circle cx="76" cy="53" r="5" fill="#00b4f0"/>
    </svg>`),
  "immoweb.be": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0284c7"/>
      <path d="M50 20 L24 44 H34 V74 H66 V44 H76 Z" fill="#ffffff"/>
      <rect x="58" y="26" width="6" height="12" fill="#ffffff"/>
      <rect x="44" y="52" width="12" height="22" rx="2" fill="#0284c7"/>
    </svg>`),
  "graftonpharmacy.co.uk": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#15803d"/>
      <rect x="42" y="24" width="16" height="52" rx="4" fill="#ffffff"/>
      <rect x="24" y="42" width="52" height="16" rx="4" fill="#ffffff"/>
    </svg>`),
  "cnn.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#cc0000"/>
      <text x="50" y="60" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-1">CNN</text>
    </svg>`),
  "edition.cnn.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#cc0000"/>
      <text x="50" y="60" font-family="Arial Black, Impact, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-1">CNN</text>
    </svg>`),
  "yoouz": "https://www.yoouz.com/icon-512.png",
  "legal500.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#09090b"/>
      <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#27272a" stroke-width="2"/>
      <text x="50" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="-1">L500</text>
      <rect x="25" y="68" width="50" height="3" rx="1.5" fill="#eab308"/>
    </svg>`),
  "www.legal500.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#09090b"/>
      <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#27272a" stroke-width="2"/>
      <text x="50" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="-1">L500</text>
      <rect x="25" y="68" width="50" height="3" rx="1.5" fill="#eab308"/>
    </svg>`),
  "l500.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#09090b"/>
      <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#27272a" stroke-width="2"/>
      <text x="50" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="-1">L500</text>
      <rect x="25" y="68" width="50" height="3" rx="1.5" fill="#eab308"/>
    </svg>`),
  "l500": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#09090b"/>
      <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#27272a" stroke-width="2"/>
      <text x="50" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="-1">L500</text>
      <rect x="25" y="68" width="50" height="3" rx="1.5" fill="#eab308"/>
    </svg>`),
  "legal-500": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#09090b"/>
      <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#27272a" stroke-width="2"/>
      <text x="50" y="56" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#eab308" text-anchor="middle" letter-spacing="-1">L500</text>
      <rect x="25" y="68" width="50" height="3" rx="1.5" fill="#eab308"/>
    </svg>`),
  "districtuae.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#38bdf8" text-anchor="middle">DRE</text>
    </svg>`),
  "www.districtuae.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0ea5e9" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#38bdf8" text-anchor="middle">DRE</text>
    </svg>`),
  "thecapitalavenue.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#d97706" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#f59e0b" text-anchor="middle">TCA</text>
    </svg>`),
  "www.thecapitalavenue.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#d97706" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="26" fill="#f59e0b" text-anchor="middle">TCA</text>
    </svg>`),
  "freecancellations.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#1e1b4b"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#6366f1" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#a5b4fc" text-anchor="middle">FC</text>
    </svg>`),
  "www.freecancellations.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#1e1b4b"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#6366f1" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="28" fill="#a5b4fc" text-anchor="middle">FC</text>
    </svg>`),
  "timehotels.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#312e81"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#818cf8" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="24" fill="#e0e7ff" text-anchor="middle">TIME</text>
    </svg>`),
  "www.timehotels.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#312e81"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#818cf8" stroke-width="2.5"/>
      <text x="50" y="58" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="24" fill="#e0e7ff" text-anchor="middle">TIME</text>
    </svg>`),
  "mastercard.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <circle cx="40" cy="50" r="24" fill="#eb001b"/>
      <circle cx="60" cy="50" r="24" fill="#f79e1b" fill-opacity="0.85"/>
    </svg>`),
  "tinder.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="tinderGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fd297b"/>
          <stop offset="50%" stop-color="#ff5864"/>
          <stop offset="100%" stop-color="#ff655b"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#tinderGrad)"/>
      <path d="M52 20 C52 20 40 33 40 48 C40 56 46 63 54 63 C58 63 62 61 65 58 C65 67 58 76 48 76 C37 76 28 67 28 55 C28 41 38 30 46 22 C44 26 44 31 46 34 C48 37 52 38 54 36 C56 34 56 28 52 20 Z" fill="#ffffff"/>
    </svg>`),
  "www.tinder.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <linearGradient id="tinderGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fd297b"/>
          <stop offset="50%" stop-color="#ff5864"/>
          <stop offset="100%" stop-color="#ff655b"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="22" fill="url(#tinderGrad2)"/>
      <path d="M52 20 C52 20 40 33 40 48 C40 56 46 63 54 63 C58 63 62 61 65 58 C65 67 58 76 48 76 C37 76 28 67 28 55 C28 41 38 30 46 22 C44 26 44 31 46 34 C48 37 52 38 54 36 C56 34 56 28 52 20 Z" fill="#ffffff"/>
    </svg>`),
  "leopoldhotelantwerp.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#7c2d12"/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#fcd34d" stroke-width="2"/>
      <text x="50" y="58" font-family="'Playfair Display', Georgia, serif" font-weight="bold" font-size="30" fill="#fef08a" text-anchor="middle">HL</text>
    </svg>`),
  "londontrustedtherapy.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f766e"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#5eead4" stroke-width="3"/>
      <path d="M50 28 C42 36 34 46 34 56 C34 66 42 72 50 72 C58 72 66 66 66 56 C66 46 58 36 50 28 Z" fill="#2dd4bf"/>
      <path d="M50 42 C46 48 42 54 42 60 C42 64 46 68 50 68 C54 68 58 64 58 60 C58 54 54 48 50 42 Z" fill="#ccfbf1"/>
    </svg>`),
  "kempinski.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#18181b"/>
      <polygon points="50,22 58,38 76,38 62,50 67,68 50,56 33,68 38,50 24,38 42,38" fill="#d4af37"/>
      <text x="50" y="86" font-family="'Cinzel', serif, Georgia" font-weight="bold" font-size="12" fill="#d4af37" text-anchor="middle" letter-spacing="1">KEMPINSKI</text>
    </svg>`),
  "ibm.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#001d6c"/>
      <text x="50" y="60" font-family="'Arial Black', Impact, sans-serif" font-weight="900" font-size="30" fill="#4589ff" text-anchor="middle" letter-spacing="1">IBM</text>
    </svg>`),
  "ups.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#351c15"/>
      <path d="M50 20 L76 30 V56 C76 72 50 82 50 82 C50 82 24 72 24 56 V30 Z" fill="#ffb500"/>
      <text x="50" y="60" font-family="Arial Black, sans-serif" font-weight="bold" font-size="20" fill="#351c15" text-anchor="middle">ups</text>
    </svg>`),
  "aa.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#00447c"/>
      <path d="M32 30 L46 70 H54 L68 30 H58 L50 56 L42 30 Z" fill="#ffffff"/>
      <path d="M50 36 L62 70 H70 L82 36 H73 L66 60 L59 36 Z" fill="#c3102f"/>
    </svg>`),
  "tajhotels.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#292524"/>
      <path d="M50 22 C38 34 30 48 30 62 C30 72 38 78 50 78 C62 78 70 72 70 62 C70 48 62 34 50 22 Z" fill="#d97706"/>
      <circle cx="50" cy="54" r="10" fill="#fef3c7"/>
    </svg>`),
  "digitalparkae.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="4 2"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#22d3ee" stroke-width="2"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">DP</text>
      <path d="M36 50 H42 M58 50 H64 M50 36 V42 M50 58 V64" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`),
  "www.digitalparkae.com": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="4 2"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#22d3ee" stroke-width="2"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">DP</text>
      <path d="M36 50 H42 M58 50 H64 M50 36 V42 M50 58 V64" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`),
  "digitalpark.ae": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="4 2"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#22d3ee" stroke-width="2"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">DP</text>
      <path d="M36 50 H42 M58 50 H64 M50 36 V42 M50 58 V64" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`),
  "www.digitalpark.ae": "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="100" height="100" rx="20" fill="#0f172a"/>
      <circle cx="50" cy="50" r="34" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="4 2"/>
      <circle cx="50" cy="50" r="26" fill="none" stroke="#22d3ee" stroke-width="2"/>
      <text x="50" y="59" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#ffffff" text-anchor="middle" letter-spacing="-0.5">DP</text>
      <path d="M36 50 H42 M58 50 H64 M50 36 V42 M50 58 V64" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`)
};

// High-fidelity fallback hero banner images for verified businesses (Only authentic domain assets, NO mock or stock photos)
export const KNOWN_BRAND_BANNERS: Record<string, string> = {
  "zoom.com": "https://st1.zoom.us/homepage/20260908-1234/primary/dist/assets/images/social-card.jpg",
  "www.zoom.com": "https://st1.zoom.us/homepage/20260908-1234/primary/dist/assets/images/social-card.jpg",
  "zoom.us": "https://st1.zoom.us/homepage/20260908-1234/primary/dist/assets/images/social-card.jpg",
  "www.zoom.us": "https://st1.zoom.us/homepage/20260908-1234/primary/dist/assets/images/social-card.jpg",
  "thecapitalavenue.com": "https://thecapitalavenue.com/wp-content/uploads/2026/06/Fay-Valley-33-1.webp",
  "www.thecapitalavenue.com": "https://thecapitalavenue.com/wp-content/uploads/2026/06/Fay-Valley-33-1.webp",
  "districtuae.com": "https://www.districtuae.com/og-default.jpeg",
  "www.districtuae.com": "https://www.districtuae.com/og-default.jpeg",
  "londontrustedtherapy.com": "https://londontrustedtherapy.com/wp-content/uploads/2026/07/private-therapy-and-psychology-london-harley-street-holborn-2.webp",
  "kempinski.com": "https://storage.kempinski.com/cdn-cgi/image/w=1920,f=auto,fit=scale-down,g=auto/ki-cms-prod/images/5/8/4/2/19522485-1-eng-GB/6a0ae1b79ed9-KISEZ1_Kayaking.jpg",
  "timehotels.com": "https://image-tc.galaxy.tf/wipng-9v50hzcs0a5z2nwwpsh62mgel/home_og-image.png",
  "freecancellations.com": "https://metasearch-cdn.azureedge.net/azure/seo-images/us/new-york-state/CDD5D4910706645C4CAD830CC6C07D52.jpg?quality=80&mode=crop&w=1200&h=800&scale=both&anchor=middlecenter",
  "ibm.com": "https://www.ibm.com/content/adobe-cms/us/en/homepage/jcr:content/root/table_of_contents/tile_group_container/container/tile_card_copy_copy_/image.coreimg.png/1787908674336/ibm-bob-homepage-uso-r4u1.png"
};

/**
 * Checks if a logo URL is a white/monochrome/inverted variant that would become
 * invisible or have unreadable contrast on light avatar badges.
 */
export function isWhiteOrInvertedLogo(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("-white") ||
    lower.includes("_white") ||
    lower.includes("white-") ||
    lower.includes("white_") ||
    lower.includes("/white.") ||
    lower.includes("white@") ||
    lower.includes("logo-white") ||
    lower.includes("logo_white") ||
    lower.includes("whitelogo") ||
    lower.includes("logo-light") ||
    lower.includes("logo_light") ||
    lower.includes("light-logo") ||
    lower.includes("monochrome") ||
    lower.includes("inverted") ||
    lower.includes("negative") ||
    lower.includes("dark-mode") ||
    lower.includes("darkmode")
  );
}

export function extractDomain(str: string | null | undefined): string | null {
  if (!str) return null;
  let trimmed = str.trim();
  if (!trimmed) return null;
  
  // Clean up if it's a full URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("://")) {
    try {
      const parsed = new URL(trimmed);
      return parsed.hostname.replace(/^www\./i, "").toLowerCase();
    } catch {
      let withoutProto = trimmed.split("://")[1] || trimmed;
      let host = withoutProto.split("/")[0] || withoutProto;
      return host.replace(/^www\./i, "").toLowerCase();
    }
  }
  
  let clean = trimmed.replace(/^www[\.\-\/]/i, "").toLowerCase();
  clean = clean.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  
  if (clean.endsWith("-co-uk")) clean = clean.replace(/-co-uk$/, ".co.uk");
  if (clean.endsWith("-com")) clean = clean.replace(/-com$/, ".com");
  if (clean.endsWith("-net")) clean = clean.replace(/-net$/, ".net");
  if (clean.endsWith("-org")) clean = clean.replace(/-org$/, ".org");
  if (clean.endsWith("-io")) clean = clean.replace(/-io$/, ".io");
  if (clean.endsWith("-co")) clean = clean.replace(/-co$/, ".co");
  if (clean.endsWith("-ai")) clean = clean.replace(/-ai$/, ".ai");
  if (clean.endsWith("-app")) clean = clean.replace(/-app$/, ".app");
  if (clean.endsWith("-dev")) clean = clean.replace(/-dev$/, ".dev");
  if (clean.endsWith("-me")) clean = clean.replace(/-me$/, ".me");
  if (clean.endsWith("-ae")) clean = clean.replace(/-ae$/, ".ae");
  if (clean.endsWith("-be")) clean = clean.replace(/-be$/, ".be");
  if (clean.endsWith("-de")) clean = clean.replace(/-de$/, ".de");
  if (clean.endsWith("-fr")) clean = clean.replace(/-fr$/, ".fr");
  if (clean.endsWith("-uk")) clean = clean.replace(/-uk$/, ".uk");
  if (clean.endsWith("-ca")) clean = clean.replace(/-ca$/, ".ca");
  if (clean.endsWith("-tech")) clean = clean.replace(/-tech$/, ".tech");
  if (clean.endsWith("-store")) clean = clean.replace(/-store$/, ".store");
  if (clean.endsWith("-online")) clean = clean.replace(/-online$/, ".online");
  if (clean.endsWith("-xyz")) clean = clean.replace(/-xyz$/, ".xyz");
  if (clean.endsWith("-site")) clean = clean.replace(/-site$/, ".site");
  if (clean.endsWith("-digital")) clean = clean.replace(/-digital$/, ".digital");
  if (clean.endsWith("-agency")) clean = clean.replace(/-agency$/, ".agency");

  if (!clean.includes(".") && /-([a-z]{2,10})$/i.test(clean)) {
    clean = clean.replace(/-([a-z]{2,10})$/i, ".$1");
  }

  if (!clean.includes(".") && clean.length > 2) {
    clean = clean.replace(/[^a-z0-9]/g, "") + ".com";
  }

  return clean;
}

export function generateBrandMonogramSvg(nameOrDomain?: string | null, size = 128): string {
  const raw = (nameOrDomain || "Place").replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim();
  const clean = raw.replace(/\.(com|org|net|io|co|ai|be|ae|uk|co\.uk)$/i, "").trim();
  
  let letters = "";
  if (clean.toLowerCase().startsWith("l500") || clean.toLowerCase() === "legal500" || clean.toLowerCase() === "legal 500") {
    letters = "L500";
  } else {
    // If multiple words, take first letter of each (up to 3 words)
    const words = clean.split(/[\s\-_\.]+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      letters = words.slice(0, 3).map(w => w[0].toUpperCase()).join("");
    } else if (clean.length > 0) {
      letters = clean.substring(0, Math.min(3, clean.length)).toUpperCase();
    } else {
      letters = "Y";
    }
  }

  const isGold = letters === "L500" || letters.startsWith("L5");
  const textColor = isGold ? "#eab308" : "#ffffff";
  const fontSize = letters.length > 3 ? Math.round(size * 0.28) : letters.length > 2 ? Math.round(size * 0.34) : Math.round(size * 0.44);

  // Modern brand palettes for dark mode contrast
  const PALETTES = [
    "#2563eb", // blue
    "#7c3aed", // violet
    "#059669", // emerald
    "#d97706", // amber
    "#dc2626", // red
    "#0891b2", // cyan
    "#4f46e5", // indigo
    "#c026d3", // fuchsia
  ];
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash << 5) - hash + clean.charCodeAt(i);
    hash |= 0;
  }
  const bgColor = isGold ? "#09090b" : PALETTES[Math.abs(hash) % PALETTES.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="${bgColor}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="${fontSize}px" letter-spacing="-0.5px">${letters}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getCleanLogoUrl(url: string | null | undefined, domain?: string | null): string | null {
  const cleanDomain = extractDomain(domain || url);
  if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
    return KNOWN_BRAND_LOGOS[cleanDomain];
  }

  // Reject white/inverted variants that disappear on light badges
  if (
    url &&
    !isWhiteOrInvertedLogo(url) &&
    (url.startsWith("data:image/") || url.startsWith("/api/") || url.startsWith("https://") || url.startsWith("http://"))
  ) {
    if (!url.includes("brandfetch.io") && !url.includes("clearbit.com") && url !== "data:;" && !url.startsWith("data:;")) {
      if (url.startsWith("/api/proxy-image")) return url;
      if (url.includes("framerusercontent.com") || url.includes("googleusercontent.com")) {
        return `/api/proxy-image?url=${encodeURIComponent(url)}`;
      }
      return url;
    }
  }

  if (cleanDomain && cleanDomain.includes(".")) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=256`;
  }

  return url || null;
}

export function getPlaceLogoUrl(place: Partial<Place> | null | undefined): string | null {
  if (!place) return null;

  let domain = place.brandDomain;
  if (!domain && place.website) {
    domain = extractDomain(place.website);
  }
  if (!domain && place.address && (place.address.startsWith("http://") || place.address.startsWith("https://"))) {
    domain = extractDomain(place.address);
  }
  if (!domain && place.id) {
    domain = extractDomain(place.id);
  }
  if (!domain && place.name) {
    domain = extractDomain(place.name);
  }

  const cleanDomain = domain?.trim().replace(/^www\./, "").toLowerCase();

  // 1. Direct match for known high-quality brand vector logos
  if (cleanDomain && KNOWN_BRAND_LOGOS[cleanDomain]) {
    return KNOWN_BRAND_LOGOS[cleanDomain];
  }

  // 2. Explicit logoUrl provided (if not a broken brandfetch or white/inverted variant)
  if (
    place.logoUrl &&
    place.logoUrl.trim() !== "" &&
    !isWhiteOrInvertedLogo(place.logoUrl) &&
    !place.logoUrl.includes("brandfetch.io") &&
    place.logoUrl !== "data:;" &&
    !place.logoUrl.startsWith("data:;")
  ) {
    if (place.logoUrl.startsWith("/api/proxy-image")) return place.logoUrl;
    if (place.logoUrl.includes("googleusercontent.com") || place.logoUrl.includes("framerusercontent.com")) {
      return `/api/proxy-image?url=${encodeURIComponent(place.logoUrl)}`;
    }
    return place.logoUrl;
  }
  
  // 3. Authentic High-Resolution Social Favicon (Google 256px resolution directly from website icon/metadata)
  if (cleanDomain && cleanDomain.includes(".")) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=256`;
  }

  return null;
}


