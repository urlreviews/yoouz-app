export type CanonicalCategoryId =
  | "all"
  | "hotels"
  | "restaurants"
  | "products"
  | "services"
  | "beauty"
  | "shopping"
  | "auto"
  | "tech";

export type ConcreteCategoryId = Exclude<CanonicalCategoryId, "all">;

export interface CanonicalCategoryMeta {
  id: CanonicalCategoryId;
  label: string;
  shortLabel: string;
  badgeLabel: string;
  headingLabel: string;
}

export const CANONICAL_CATEGORIES: CanonicalCategoryMeta[] = [
  { id: "all", label: "All", shortLabel: "All", badgeLabel: "All", headingLabel: "Live Photo Reviews" },
  { id: "hotels", label: "Hotels", shortLabel: "Hotels", badgeLabel: "Hotel", headingLabel: "Hotel & Travel Reviews" },
  { id: "restaurants", label: "Restaurants", shortLabel: "Dining", badgeLabel: "Dining", headingLabel: "Restaurant & Dining Reviews" },
  { id: "products", label: "Products", shortLabel: "Products", badgeLabel: "Product", headingLabel: "Product Reviews" },
  { id: "services", label: "Services", shortLabel: "Services", badgeLabel: "Service", headingLabel: "Service Reviews" },
  { id: "beauty", label: "Beauty", shortLabel: "Beauty", badgeLabel: "Beauty", headingLabel: "Beauty & Skincare Reviews" },
  { id: "shopping", label: "Shopping", shortLabel: "Shopping", badgeLabel: "Shopping", headingLabel: "Shopping & Retail Reviews" },
  { id: "auto", label: "Auto", shortLabel: "Auto", badgeLabel: "Auto", headingLabel: "Auto Reviews" },
  { id: "tech", label: "Tech", shortLabel: "Tech", badgeLabel: "Tech", headingLabel: "Tech & App Reviews" },
];

export interface CategoryClassification {
  canonicalId: ConcreteCategoryId;
  canonicalLabel: string;
  specificCategory: string;
  badgeLabel: string;
  isFallback: boolean;
  confidence: "high" | "medium" | "low";
}

const GENERIC_CATEGORY_SET = new Set([
  "",
  "website",
  "official website",
  "verified business",
  "business",
  "business & services",
  "business & professional services",
  "online business",
  "brand",
  "general",
  "local business",
  "verified google business",
  "establishment",
  "venue",
  "other",
  "all",
  "online",
  "company",
]);

export function isGenericCategory(cat?: string | null): boolean {
  if (!cat) return true;
  return GENERIC_CATEGORY_SET.has(cat.trim().toLowerCase());
}

type KnownDomainSeed = {
  canonicalId: ConcreteCategoryId;
  canonicalLabel: string;
  specificCategory: string;
  badgeLabel: string;
};

const KNOWN_DOMAIN_CATEGORIES: Record<string, KnownDomainSeed> = {
  // Hotels & Travel
  "thehoxton.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "hilton.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "marriott.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "hyatt.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "ihg.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "accor.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "fourseasons.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "easyhotel.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "rixos.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "jumeirah.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "mandarinoriental.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "rotana.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "danhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "clubhotel.co.il": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Resort Hotel & Suites", badgeLabel: "Hotel" },
  "hoteldesgaleries.be": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "hotel-julien.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "parkregency.net": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Resort", badgeLabel: "Hotel" },
  "thestrat.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "wynnlasvegas.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "citizenm.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "sohohouse.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "radissonhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "wyndhamhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "choicehotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "bestwestern.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "melia.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Resort", badgeLabel: "Hotel" },
  "nh-hotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "shangri-la.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "rosewoodhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "aman.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "belmond.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "editionhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "acehotel.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "standardhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "nobuhotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "sonder.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Stays & Hospitality", badgeLabel: "Stay" },
  "booking.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "airbnb.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Stays & Hospitality", badgeLabel: "Stay" },
  "expedia.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "hotels.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "trivago.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "tripadvisor.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "agoda.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "kayak.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "skyscanner.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "trip.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "delta.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "jetblue.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "united.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "aa.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "ryanair.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "lufthansa.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "emirates.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "klm.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Airlines & Travel", badgeLabel: "Travel" },
  "toureiffel.paris": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Landmark & Travel", badgeLabel: "Travel" },

  // Restaurants, Cafes & Food Delivery
  "mcdonalds.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "burgerking.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "bk.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "dominos.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Pizza & Fast Food", badgeLabel: "Restaurant" },
  "dunkindonuts.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "starbucks.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "doordash.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "wolt.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "ubereats.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "deliveroo.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "chipotle.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Restaurant & Dining", badgeLabel: "Restaurant" },
  "kfc.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "subway.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "wendys.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "tacobell.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "popeyes.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "fiveguys.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Burger & Fast Food", badgeLabel: "Restaurant" },
  "shakeshack.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Burger & Fast Food", badgeLabel: "Restaurant" },
  "pizzahut.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Pizza & Fast Food", badgeLabel: "Restaurant" },
  "papajohns.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Pizza & Fast Food", badgeLabel: "Restaurant" },
  "pret.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "costa.co.uk": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "timhortons.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "nandos.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Restaurant & Dining", badgeLabel: "Restaurant" },
  "wagamama.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Restaurant & Dining", badgeLabel: "Restaurant" },
  "booksandbeans.co.uk": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Cafe & Bookstore", badgeLabel: "Cafe" },

  // Products (Consumer Goods, Footwear, Watches, Appliances, Electronics)
  "nike.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Sportswear & Footwear", badgeLabel: "Product" },
  "adidas.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Sportswear & Footwear", badgeLabel: "Product" },
  "birkenstock.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Footwear & Products", badgeLabel: "Product" },
  "guesswatches.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Watches & Accessories", badgeLabel: "Product" },
  "philips.nl": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Electronics", badgeLabel: "Product" },
  "philips.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Electronics", badgeLabel: "Product" },
  "sony.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Electronics", badgeLabel: "Product" },
  "samsung.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Electronics", badgeLabel: "Product" },
  "dyson.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Home Appliances", badgeLabel: "Product" },
  "sutas.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Food & Consumer Goods", badgeLabel: "Product" },
  "youtooz.com": { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Collectibles & Toys", badgeLabel: "Product" },

  // Beauty, Skincare & Wellness
  "sephora.com": { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Beauty & Cosmetics", badgeLabel: "Beauty" },
  "cetaphil.com": { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Skincare & Beauty", badgeLabel: "Skincare" },
  "nivea.com": { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Skincare & Beauty", badgeLabel: "Skincare" },
  "loreal.com": { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Beauty & Cosmetics", badgeLabel: "Beauty" },
  "ulta.com": { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Beauty & Cosmetics", badgeLabel: "Beauty" },

  // Shopping & Retail
  "amazon.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "uniqlo.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Apparel & Clothing", badgeLabel: "Shopping" },
  "zara.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "zara.comtakes": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "hm.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "shein.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "asos.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "zalando.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Fashion & Apparel", badgeLabel: "Shopping" },
  "ikea.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Home & Furniture Retail", badgeLabel: "Shopping" },
  "target.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Department Store", badgeLabel: "Shopping" },
  "walmart.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Supermarket & Retail", badgeLabel: "Shopping" },
  "costco.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Supermarket & Retail", badgeLabel: "Shopping" },
  "bestbuy.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Electronics Retail", badgeLabel: "Shopping" },
  "homedepot.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Home Improvement Retail", badgeLabel: "Shopping" },
  "decathlon.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Sports & Outdoor Retail", badgeLabel: "Shopping" },
  "etsy.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "ebay.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "aliexpress.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "temu.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "7-eleven.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Convenience Store", badgeLabel: "Retail" },
  "rakuten.co.jp": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "mercadolibre.com.mx": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "bol.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "E-Commerce & Retail", badgeLabel: "Shopping" },
  "coolblue.nl": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Electronics Retail", badgeLabel: "Shopping" },

  // Auto & Mobility
  "izci.be": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto Repair & Garage", badgeLabel: "Auto" },
  "tesla.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Automotive & EV", badgeLabel: "Auto" },
  "hertz.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto & Car Rental", badgeLabel: "Auto" },
  "sixt.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto & Car Rental", badgeLabel: "Auto" },
  "avis.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto & Car Rental", badgeLabel: "Auto" },
  "uber.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Ride-Hailing & Mobility", badgeLabel: "Auto" },
  "lyft.com": { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Ride-Hailing & Mobility", badgeLabel: "Auto" },

  // Tech, Software & Media
  "apple.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Consumer Electronics & Tech", badgeLabel: "Tech" },
  "google.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Technology & Software", badgeLabel: "Tech" },
  "openai.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "AI & Software", badgeLabel: "Tech" },
  "anthropic.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "AI & Software", badgeLabel: "Tech" },
  "webflow.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Software & SaaS", badgeLabel: "Tech" },
  "whatsapp.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Messaging & Tech", badgeLabel: "Tech" },
  "zoom.us": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Software & Communications", badgeLabel: "Tech" },
  "slack.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Software & SaaS", badgeLabel: "Tech" },
  "notion.so": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Software & SaaS", badgeLabel: "Tech" },
  "figma.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Design & Software", badgeLabel: "Tech" },
  "shopify.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "E-Commerce Software", badgeLabel: "Tech" },
  "stripe.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Fintech & Payments", badgeLabel: "Tech" },
  "veeva.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Enterprise Software", badgeLabel: "Tech" },
  "flipper.net": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Tech & Gadgets", badgeLabel: "Tech" },
  "netflix.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "spotify.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "disneyplus.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "hulu.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "max.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "twitch.tv": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "youtube.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "videoland.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "haystack.tv": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & News Media", badgeLabel: "Media" },
  "rtp.pt": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Broadcasting & Media", badgeLabel: "Media" },
  "gundam-official.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Entertainment & Media", badgeLabel: "Media" },
  "researchgate.net": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Science & Tech Platform", badgeLabel: "Tech" },
  "gamanetworks.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "IT & Network Solutions", badgeLabel: "Tech" },
  "com.eg": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Telecom & Connectivity", badgeLabel: "Tech" },
  "yoouz.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Live Photo Reviews Platform", badgeLabel: "Tech" },

  // Services (Legal, Cleaning, Finance, Healthcare, Facilities)
  "mamotcv.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Legal Services", badgeLabel: "Legal" },
  "bnpparibas.fr": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Banking & Finance", badgeLabel: "Finance" },
  "revolut.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Banking & Finance", badgeLabel: "Finance" },
  "wise.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Banking & Finance", badgeLabel: "Finance" },
  "paypal.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Payments & Finance", badgeLabel: "Finance" },
  "wowcleannyc.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "havenhomecleaning.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "highclasscleaning.co": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "aramark.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Hospitality & Facilities", badgeLabel: "Service" },
  "denieuwecirkel.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Healthcare & Medical", badgeLabel: "Health" },
  "ycombinator.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Finance & Venture Capital", badgeLabel: "Finance" },
};

function cleanDomainForCategory(raw?: string | null): string {
  if (!raw) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/^web_/, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\d*\./, "")
    .split("/")[0]
    .split("?")[0]
    .trim();
}

function makeClassification(
  canonicalId: ConcreteCategoryId,
  specificCategory: string,
  badgeLabel: string,
  confidence: "high" | "medium" | "low",
  isFallback = false
): CategoryClassification {
  const meta = CANONICAL_CATEGORIES.find((m) => m.id === canonicalId)!;
  return {
    canonicalId,
    canonicalLabel: meta.label,
    specificCategory,
    badgeLabel,
    confidence,
    isFallback,
  };
}

function deriveBadgeFromSpecific(specific: string, canonicalId: ConcreteCategoryId): string {
  const s = specific.toLowerCase();
  if (canonicalId === "hotels") {
    if (s.includes("airline") || s.includes("flight") || s.includes("travel") || s.includes("landmark") || s.includes("attraction")) {
      return "Travel";
    }
    if (s.includes("stay")) return "Stay";
    return "Hotel";
  }
  if (canonicalId === "restaurants") {
    if (s.includes("delivery")) return "Delivery";
    if (s.includes("coffee") || s.includes("cafe") || s.includes("café") || s.includes("bakery")) return "Cafe";
    if (s.includes("bar") || s.includes("lounge") || s.includes("nightlife")) return "Bar";
    return "Restaurant";
  }
  if (canonicalId === "beauty") {
    if (s.includes("skincare")) return "Skincare";
    if (s.includes("spa") || s.includes("wellness") || s.includes("massage")) return "Wellness";
    if (s.includes("salon") || s.includes("hair") || s.includes("barber")) return "Salon";
    if (s.includes("optician") || s.includes("eyewear")) return "Eyewear";
    return "Beauty";
  }
  if (canonicalId === "services") {
    if (s.includes("legal") || s.includes("law")) return "Legal";
    if (s.includes("clean")) return "Cleaning";
    if (s.includes("dentist") || s.includes("dental")) return "Dental";
    if (s.includes("health") || s.includes("medical") || s.includes("clinic") || s.includes("pharmacy")) return "Health";
    if (s.includes("real estate") || s.includes("property")) return "Real Estate";
    if (s.includes("venture") || s.includes("bank") || s.includes("finance") || s.includes("invest") || s.includes("payment")) return "Finance";
    if (s.includes("education") || s.includes("university") || s.includes("school") || s.includes("learning")) return "Education";
    if (s.includes("government") || s.includes("public") || s.includes("judicial") || s.includes("court")) return "Public";
    if (s.includes("marketing") || s.includes("agency") || s.includes("creative")) return "Agency";
    return "Service";
  }
  if (canonicalId === "auto") return "Auto";
  if (canonicalId === "shopping") {
    if (s.includes("convenience") || s.includes("supermarket") || s.includes("grocery")) return "Retail";
    return "Shopping";
  }
  if (canonicalId === "tech") {
    if (s.includes("stream") || s.includes("media") || s.includes("entertain") || s.includes("broadcast") || s.includes("news")) return "Media";
    return "Tech";
  }
  return "Product";
}

function mapRawCategoryToCanonical(rawCategory: string): ConcreteCategoryId | null {
  const c = rawCategory.trim().toLowerCase();
  if (!c || isGenericCategory(c)) return null;

  // Hotels & Travel
  if (/\b(hotels?|h[oô]tels?|resorts?|motels?|hostels?|lodg(?:e|ing)|hospitality|suites?|stays?|airlines?|flights?|travel|tourism|landmark|attraction|museum|cultural)\b/i.test(c)) {
    if (/\bfacilities\b/i.test(c)) return "services";
    return "hotels";
  }
  // Restaurants, Cafes & Food
  if (/\b(restaurants?|dining|fast food|pizza|pizzeria|caf[eé]s?|coffee|baker(?:y|ies)|pastry|bistro|brasserie|food|delivery|bars?|lounge|nightlife|confectionery|sushi|burger|grill)\b/i.test(c)) {
    if (/\bconsumer goods|dairy\b/i.test(c)) return "products";
    return "restaurants";
  }
  // Beauty, Skincare & Wellness
  if (/\b(beauty|cosmetics|skincare|salons?|hair|barber|spas?|wellness|massage|grooming|optician|eyewear|fragrance|perfume)\b/i.test(c)) {
    return "beauty";
  }
  // Auto & Mobility
  if (/\b(auto|automotive|cars?|garage|mechanic|tire|tyre|gas station|fuel|mobility|ev|vehicle|dealership|motor|ride-hailing)\b/i.test(c)) {
    return "auto";
  }
  // Tech, Software & Digital Platforms
  if (/\b(software|saas|ai\b|artificial intelligence|tech|technology|digital|telecom|network|it\s|app\b|platform|streaming|media|broadcasting|entertainment|gaming|science|cloud|cyber|fintech|communications)\b/i.test(c)) {
    if (/\bconsumer electronics\b/i.test(c) && !/\btech\b/i.test(c)) return "products";
    return "tech";
  }
  // Products (Footwear, Watches, Appliances, Goods)
  if (/\b(products?|footwear|sportswear|watch(?:es)?|appliance|gadget|hardware|consumer goods|accessories|toys|collectibles|electronics)\b/i.test(c)) {
    return "products";
  }
  // Shopping & Retail
  if (/\b(shopping|retail|e-commerce|ecommerce|stores?|boutique|mall|supermarket|hypermarket|convenience|grocery|apparel|clothing|fashion|furniture|department)\b/i.test(c)) {
    return "shopping";
  }
  // Services (Legal, Cleaning, Medical, Finance, Agencies, Real Estate, Trades, Education, Government)
  if (/\b(services?|legal|law|attorney|cleaning|plumb|hvac|repair|medical|health|clinic|dentist|dental|pharmacy|hospital|real estate|property|marketing|agency|creative|consulting|finance|bank|venture|capital|invest|payments?|insurance|education|university|school|learning|government|public|judicial|court|logistics|shipping|office|industrial|fitness|gym|city or town hall)\b/i.test(c)) {
    return "services";
  }
  return null;
}

/**
 * Classifies from high-authority primary identity signals (Domain structure + Business Name).
 * These signals represent what the business IS (e.g. "Hotel Julien", "Great Oaks Venture Capital",
 * "allhotelsdubai.com", "usv.edu") and cannot be hijacked by secondary amenities or investment sectors
 * mentioned in a description/footer (like "spa" on a hotel or "healthcare" on a VC firm).
 */
function classifyFromPrimaryIdentity(cleanDom: string, name: string): CategoryClassification | null {
  const domRoot = cleanDom.split(".")[0] || "";
  const identityText = `${cleanDom} ${name}`.toLowerCase();

  // 1. Government & Education TLDs / Primary Institutional Names
  if (/\.gov(\.[a-z]{2})?$/i.test(cleanDom) || /\b(supreme court|judicial branch|city hall|town hall|municipality|government)\b/i.test(identityText)) {
    return makeClassification("services", "Government & Public", "Public", "high");
  }
  if (/\.edu(\.[a-z]{2})?$/i.test(cleanDom) || /\b(university|college|academy|institute of technology)\b/i.test(identityText)) {
    return makeClassification("services", "Education & Learning", "Education", "high");
  }

  // 2a. Banks & Credit Unions (handles compound domains like bankjerusalem.co.il, bankleumi.co.il, deutschebank.de + multilingual bank names)
  if (
    /^(?:bank|banque|banco|banca)[a-z0-9-]{2,}|[a-z0-9-]{2,}(?:bank|banque|banco|banca|banken)$/i.test(domRoot) ||
    /\b(bank|banque|banco|banca|credit\s+union|savings\s+bank|central\s+bank)\b/i.test(identityText) ||
    /(?:^|[\s\-"'׳״])(בנק|בנקאות|بنك|مصرف|банк|銀行|银行)(?:$|[\s\-"'׳״])/i.test(identityText)
  ) {
    return makeClassification("services", "Banking & Finance", "Finance", "high");
  }

  // 2b. Finance, Venture Capital & Investment Firms (Domain TLD or Name explicitly states VC/Ventures/Capital/Investments)
  if (
    /\.vc$|\.ventures$|\.capital$/i.test(cleanDom) ||
    /(ventures?|capital|vc|equity|invest(?:ments?)?|angel)\.(com|co|io|be|in|uk|org|fr|de|il|co\.il)$/i.test(cleanDom) ||
    /\b(venture capital|ventures|venture\s+stars|vc\b|angel\s+invest|sv\s+angel|investments?|capital\s+partners|private\s+equity|asset\s+management)\b/i.test(identityText)
  ) {
    return makeClassification("services", "Finance & Venture Capital", "Finance", "high");
  }

  // 3. Hotels, Resorts, Hostels, Motels & Airlines (handles plurals + compound domains like allhotelsdubai.com, istanbulhotelturkey.com + multilingual)
  if (
    /(hotels?|resorts?|hostels?|motels?|aparthotel|suites|airlines?|airways)/i.test(domRoot) ||
    /\b(hotels?|h[oô]tels?|resorts?|hostels?|motels?|suites?|aparthotel|guesthouse|bed\s*(?:&|and)\s*breakfast|airlines?|airways?)\b/i.test(identityText) ||
    /(?:^|[\s\-"'׳״])(מלון|מלונות|فندق|отель|ホテル|酒店)(?:$|[\s\-"'׳״])/i.test(identityText)
  ) {
    const isTravel = /(airlines?|airways?)/i.test(identityText);
    const isResort = /resorts?/i.test(identityText);
    return makeClassification(
      "hotels",
      isTravel ? "Airlines & Travel" : isResort ? "Hotel & Resort" : "Hotel & Hospitality",
      isTravel ? "Travel" : "Hotel",
      "high"
    );
  }

  // 4. Restaurants, Cafes, Bakeries, Pizzerias & Food
  if (
    /\b(restaurants?|bistros?|brasseries?|pizzerias?|pizza|sushi|burger|steakhouse|baker(?:y|ies)|patisserie|coffee|caf[eé]s?|diner|taqueria|trattoria|osteria|ramen)\b/i.test(identityText)
  ) {
    const isCafe = /\b(coffee|caf[eé]s?|baker(?:y|ies)|patisserie)\b/i.test(identityText);
    return makeClassification("restaurants", isCafe ? "Coffee & Bakery" : "Restaurant & Dining", isCafe ? "Cafe" : "Restaurant", "high");
  }

  // 5. Cleaning & Home Trades
  if (/\b(clean(?:ing|ers)?|maid|plumb(?:ing|er)|hvac|electrician|roofing|handyman|moving)\b/i.test(identityText)) {
    const isCleaning = /clean|maid/i.test(identityText);
    return makeClassification("services", isCleaning ? "Home Services & Cleaning" : "Home & Trade Services", isCleaning ? "Cleaning" : "Service", "high");
  }

  // 6. Auto & Garage
  if (/\b(garage|auto\s*repair|autowerkplaats|car\s*rental|car\s*wash|motors?|dealership|mechanic|tyre|tire)\b/i.test(identityText)) {
    return makeClassification("auto", "Auto Repair & Mobility", "Auto", "high");
  }

  // 7. Legal
  if (/\b(law\s*firm|lawyers?|attorneys?|legal|advocaat|advocaten|avocat|solicitors?|notary)\b/i.test(identityText)) {
    return makeClassification("services", "Legal Services", "Legal", "high");
  }

  // 8. Healthcare, Dental & Pharmacy
  if (/\b(dentist|dental|orthodont|tandarts|pharmacy|apotheek|pharmacie|multipharma|medical\s*clinic|hospital|praktijk|clinic)\b/i.test(identityText)) {
    const isDental = /dentist|dental|orthodont|tandarts/i.test(identityText);
    return makeClassification("services", isDental ? "Dental & Healthcare" : "Healthcare & Medical", isDental ? "Dental" : "Health", "high");
  }

  // 9. Beauty, Salon, Barber, Spa, Optician (already excluded hotels/resorts above!)
  if (/\b(beauty|cosmetics|skincare|hair\s*salon|barber(?:shop)?|nail\s*salon|day\s*spa|optiek|optician|opticien|eyewear)\b/i.test(identityText)) {
    const isSpa = /day\s*spa/i.test(identityText);
    const isSalon = /salon|barber/i.test(identityText);
    return makeClassification("beauty", isSpa ? "Spa & Wellness" : isSalon ? "Hair & Beauty Salon" : "Beauty & Cosmetics", isSpa ? "Wellness" : isSalon ? "Salon" : "Beauty", "high");
  }

  // 10. Streaming / TV / News Media in domain/name
  if (/\.tv$/i.test(cleanDom) || /\b(news|television|streaming|broadcast)\b/i.test(identityText)) {
    return makeClassification("tech", "Streaming & Media", "Media", "high");
  }

  return null;
}

/**
 * Classifies from rich metadata text (description + keywords + name + domain) with
 * conflict guards (e.g. "Boutique Hotels" -> Hotels, NEVER Shopping; "invests in healthcare startups" -> VC, NEVER Healthcare).
 */
function classifyFromMetadataText(cleanDom: string, name: string, description: string, keywords: string): CategoryClassification | null {
  const combined = [cleanDom, name, description, keywords].join(" ").toLowerCase();
  if (!combined.trim()) return null;

  // 1a. Banking & Financial Institutions (English + multilingual)
  if (
    /\b(banking|bnp paribas|credit union|wealth management|mortgage lender|insurance provider)\b/i.test(combined) ||
    /(בנקאות|משכנתאות|הלוואות|פיקדונות|פיננסיים|חיסכון ארוך טווח|בנק\s)/i.test(combined)
  ) {
    return makeClassification("services", "Banking & Finance", "Finance", "medium");
  }

  // 1b. Venture Capital / Investment / Private Equity
  if (
    /\b(venture capital|seed fund|seed[- ]stage|early[- ]stage invest|pre[- ]seed|series a|private equity|portfolio management|investment firm|investment fund|investment group|angel invest|venture firm|venture studio|venture creation|venture scale|b2b startups|back founders|backs.*founders|invest(?:s|ing)?\s+(?:in\s+)?(?:early[- ]stage|founders|startups|seed|high[- ]growth|tech(?:nology)?\s+companies)|sfdr|financement non-dilutif)\b/i.test(combined)
  ) {
    return makeClassification("services", "Finance & Venture Capital", "Finance", "medium");
  }

  // 2. Hotels, Resorts, Stays & Airlines / Travel (plural-aware: hotels, resorts, hostels, motels, suites!)
  if (
    /\b(hotels?|h[oô]tels?|resorts?|suites?|motels?|hostels?|boutique\s+hotels?|boutique\s+stays?|open[- ]house\s+hotels?|hospitality|comfy\s+beds|rooms?\s*(?:&|and)\s*suites?|book\s+(?:your\s+)?stay|vacation\s+rentals?|flights?\s+to|airlines?|airways?|inflight|boarding|landmark|eiffel\s+tower|tourist\s+attraction)\b/i.test(combined)
  ) {
    const isTravel = /\b(airlines?|airways?|flights?|inflight|eiffel|tourist|attraction)\b/i.test(combined);
    const isResort = /\bresorts?\b/i.test(combined);
    return makeClassification(
      "hotels",
      isTravel ? "Airlines & Travel" : isResort ? "Hotel & Resort" : "Hotel & Hospitality",
      isTravel ? "Travel" : "Hotel",
      "medium"
    );
  }

  // 3. Education & Learning Platforms
  if (/\b(accredited\s+(?:university|college|degree)|learning\s+platform|online\s+courses|training\s+opportunities|higher\s+education|tuition|undergraduate|graduate\s+programs?)\b/i.test(combined)) {
    return makeClassification("services", "Education & Learning", "Education", "medium");
  }

  // 4. Cleaning & Home Trades
  if (/\b(cleaning\s+service|maid\s+service|deep\s+clean|house\s+clean|apartment\s+clean|commercial\s+clean|janitor|plumbing|plomberie|hvac|chauffage|sanitair|electrician|roofing|handyman|moving\s+company|pest\s+control|landscaping)\b/i.test(combined)) {
    const isCleaning = /clean|maid/i.test(combined);
    return makeClassification("services", isCleaning ? "Home Services & Cleaning" : "Home & Trade Services", isCleaning ? "Cleaning" : "Service", "medium");
  }

  // 5. Restaurants, Cafes, Bakeries & Food Delivery
  if (/\b(restaurants?|bistros?|brasseries?|pizzerias?|pizza|sushi|burgers?|steakhouse|baker(?:y|ies)|patisserie|pastry|coffee\s+roaster|espresso|caf[eé]s?|diner|food\s+delivery|order\s+food|takeout|takeaway|all-day\s+dining|fine\s+dining|catering)\b/i.test(combined)) {
    const isDelivery = /food\s+delivery|order\s+food|takeout|takeaway/i.test(combined);
    const isCafe = /coffee|caf[eé]s?|baker(?:y|ies)|pastry|espresso/i.test(combined);
    return makeClassification(
      "restaurants",
      isDelivery ? "Food & Delivery" : isCafe ? "Coffee & Bakery" : "Restaurant & Dining",
      isDelivery ? "Delivery" : isCafe ? "Cafe" : "Restaurant",
      "medium"
    );
  }

  // 6. Beauty, Skincare, Cosmetics, Salons & Wellness
  if (/\b(skincare|cosmetics|makeup|beauty\s+(?:brand|store|products?|salon)|fragrance|perfume|hair\s+salon|barbershop|nail\s+salon|massage\s+therapy|day\s+spa|wellness\s+center|facial\s+treatment|optiek|optician|opticien|eyewear|brillen|contactlenzen)\b/i.test(combined)) {
    const isSkin = /skincare|lotion|moisturiz|cleanser|balm|aftershave/i.test(combined);
    const isSpa = /massage|day\s+spa|wellness|facial/i.test(combined);
    return makeClassification("beauty", isSkin ? "Skincare & Beauty" : isSpa ? "Spa & Wellness" : "Beauty & Cosmetics", isSkin ? "Skincare" : isSpa ? "Wellness" : "Beauty", "medium");
  }

  // 7. Auto & Mobility
  if (/\b(auto\s+repair|car\s+service|car\s+wash|car\s+rental|rental\s+car|auto\s+rental|dealership|garage|mechanic|tire\s+service|tyre|automotive|gas\s+station|electric\s+vehicle)\b/i.test(combined)) {
    return makeClassification("auto", "Auto Repair & Mobility", "Auto", "medium");
  }

  // 8. Legal Services
  if (/\b(law\s+firm|attorneys?|lawyers?|legal\s+services?|advocaat|avocat|solicitor|litigation|injury\s+law|notary)\b/i.test(combined)) {
    return makeClassification("services", "Legal Services", "Legal", "medium");
  }

  // 9. Healthcare, Dental & Medical
  if (/\b(dentist|dental|orthodont|tandarts|zahnarzt|pharmacy|apotheek|pharmacie|drugstore|medical\s+clinic|hospital|doctor|physician|groepspraktijk|healthcare\s+provider|physiotherapy|psychotherapy|chiropractor)\b/i.test(combined)) {
    const isDental = /dentist|dental|orthodont|tandarts|zahnarzt/i.test(combined);
    return makeClassification("services", isDental ? "Dental & Healthcare" : "Healthcare & Medical", isDental ? "Dental" : "Health", "medium");
  }

  // 10. Real Estate
  if (/\b(real\s+estate|realtor|property\s+management|properties\s+for\s+sale|apartments?\s+for\s+rent|brokerage|immo)\b/i.test(combined)) {
    return makeClassification("services", "Real Estate", "Real Estate", "medium");
  }

  // 11. Marketing & Creative Agencies
  if (/\b(marketing\s+agency|digital\s+agency|advertising\s+agency|creative\s+agency|branding\s+agency|web\s+design\s+agency|seo\s+agency|pr\s+agency|media\s+agency)\b/i.test(combined)) {
    return makeClassification("services", "Marketing & Creative Agency", "Agency", "medium");
  }

  // 12. Streaming, TV, News, Software, AI, Tech & Telecom
  if (
    /\b(artificial\s+general\s+intelligence|ai\s+search|ai\s+research|software|saas|cloud\s+platform|webflow|messenger|stay\s+in\s+touch|it\s+solutions|network\s+solutions|telecom|films?\s*(?:&|and)\s*series|watch\s+.*\bonline|stream(?:ing)?\s+(?:straight|movies|series|tv|live)|films\s+en\s+programma|local\s*(?:&|and)\s*global\s+channels|tv\s+e\s+na\s+r[aá]dio|gaming|developer\s+platform|api\s+platform|researchgate)\b/i.test(combined)
  ) {
    const isMedia = /films?\s*(?:&|and)\s*series|stream|films\s+en\s+programma|gundam|anime|movie|tv\s+show|channels|r[aá]dio|news/i.test(combined);
    return makeClassification("tech", isMedia ? "Streaming & Media" : "Technology & Software", isMedia ? "Media" : "Tech", "medium");
  }

  // 13. Shopping, Fashion, Marketplaces & Retail
  // Note: NEVER treat standalone "boutique" as retail if hospitality/investment/advisory/law/fitness context is present
  const hasNonRetailBoutiqueContext = /\b(hotel|hotels|resort|stay|hospitality|investment|portfolio|advisory|law|legal|agency|consulting|venture|fitness|pilates|gym)\b/i.test(combined);
  if (
    /\b(shopping|marketplace|online\s+store|e-commerce|ecommerce|env[íi]o\s+gratis|compre\s+productos|ショッピング|通販|supermarket|hypermarket|convenience\s+store|department\s+store|jackets|knitwear|dresses|apparel|clothing\s+store|fashion\s+(?:brand|inspir|store)|furniture.*home\s+accessories)\b/i.test(combined) ||
    (!hasNonRetailBoutiqueContext && /\b(fashion\s+boutique|clothing\s+boutique|retail\s+boutique|boutique\s+store)\b/i.test(combined))
  ) {
    const isFashion = /jackets|knitwear|dresses|apparel|clothing|fashion/i.test(combined);
    return makeClassification("shopping", isFashion ? "Fashion & Apparel" : "E-Commerce & Retail", "Shopping", "medium");
  }

  // 14. Consumer Products (Watches, Footwear, Collectibles, Appliances, Hardware, Electronics)
  if (/\b(watches|timepiece|footwear|sneakers|shoes|sandals|clogs|collectibles|shaver|groomer|headphone|speaker|playstation|controller|camera\s+gear|home\s+appliance|consumer\s+electronics|sportswear)\b/i.test(combined)) {
    return makeClassification("products", "Consumer Products", "Product", "medium");
  }

  return null;
}

export function classifyBusinessCategory(input: {
  rawCategory?: string | null;
  name?: string | null;
  domain?: string | null;
  description?: string | null;
  schemaTypes?: string[] | null;
  keywords?: string | null;
}): CategoryClassification {
  const cleanDom = cleanDomainForCategory(input.domain);
  const rawCat = (input.rawCategory || "").trim();
  const cleanName = (input.name || "").trim();
  const cleanDesc = (input.description || "").trim();
  const cleanKeywords = (input.keywords || "").trim();

  // 1. Exact known domain match (highest precision — NEVER overridden by stale/noisy DB categories from a different bucket)
  if (cleanDom && KNOWN_DOMAIN_CATEGORIES[cleanDom]) {
    const known = KNOWN_DOMAIN_CATEGORIES[cleanDom];
    if (rawCat && !isGenericCategory(rawCat)) {
      const mappedFromRaw = mapRawCategoryToCanonical(rawCat);
      // Only preserve a custom specificCategory if it belongs to the SAME canonical vertical AND sub-vertical (e.g. "Luxury Hotel & Resort" for a hotel)
      if (mappedFromRaw && mappedFromRaw === known.canonicalId && deriveBadgeFromSpecific(rawCat, mappedFromRaw) === known.badgeLabel) {
        return makeClassification(mappedFromRaw, rawCat, deriveBadgeFromSpecific(rawCat, mappedFromRaw), "high");
      }
    }
    return makeClassification(known.canonicalId, known.specificCategory, known.badgeLabel, "high");
  }

  // 2. Schema.org @type signals (authoritative structured markup from the official website)
  const schemaJoined = Array.isArray(input.schemaTypes) ? input.schemaTypes.join(" ").toLowerCase() : "";
  if (schemaJoined) {
    if (/\b(hotel|resort|motel|lodgingbusiness|bedandbreakfast|hostel|airline|travelagency)\b/.test(schemaJoined)) {
      return makeClassification("hotels", "Hotel & Hospitality", "Hotel", "high");
    }
    if (/\b(restaurant|foodestablishment|cafeorcoffeeshop|bakery|fastfoodrestaurant|barorpub|icecreamshop|winery)\b/.test(schemaJoined)) {
      const isCafe = /cafe|coffee|bakery/.test(schemaJoined);
      return makeClassification("restaurants", isCafe ? "Coffee & Bakery" : "Restaurant & Dining", isCafe ? "Cafe" : "Restaurant", "high");
    }
    if (/\b(beautysalon|dayspa|healthandbeautybusiness|hairsalon|nailsalon|optician)\b/.test(schemaJoined)) {
      return makeClassification("beauty", "Beauty & Wellness", "Beauty", "high");
    }
    if (/\b(automotivebusiness|autorepair|autodealer|autorental|gasstation|carwash)\b/.test(schemaJoined)) {
      return makeClassification("auto", "Auto Repair & Mobility", "Auto", "high");
    }
    if (/\b(product|brand)\b/.test(schemaJoined) && !/\borganization\b/.test(schemaJoined)) {
      return makeClassification("products", "Consumer Products", "Product", "high");
    }
    if (/\b(store|onlinestore|clothingstore|departmentstore|grocerystore|conveniencestore|shoppingcenter|furniturestore|shoestore|jewelrystore|sportinggoodsstore|electronicsstore)\b/.test(schemaJoined)) {
      return makeClassification("shopping", "Retail & Shopping", "Shopping", "high");
    }
    if (/\b(softwareapplication|webapplication|mobileapplication|techarticle)\b/.test(schemaJoined)) {
      return makeClassification("tech", "Technology & Software", "Tech", "high");
    }
    if (/\b(collegeoruniversity|educationalorganization|school)\b/.test(schemaJoined)) {
      return makeClassification("services", "Education & Learning", "Education", "high");
    }
    if (/\b(governmentorganization|courthouse|cityhall)\b/.test(schemaJoined)) {
      return makeClassification("services", "Government & Public", "Public", "high");
    }
    if (/\b(legalservice|attorney|notary|accountingservice|financialservice|bankorcreditunion|realestateagent|medicalbusiness|dentist|physician|hospital|pharmacy|homeandconstructionbusiness|plumber|electrician|hvacbusiness|housepainter|movingcompany)\b/.test(schemaJoined)) {
      if (/legal|attorney|notary/.test(schemaJoined)) return makeClassification("services", "Legal Services", "Legal", "high");
      if (/medical|dentist|physician|hospital|pharmacy/.test(schemaJoined)) return makeClassification("services", "Healthcare & Medical", "Health", "high");
      if (/realestate/.test(schemaJoined)) return makeClassification("services", "Real Estate", "Real Estate", "high");
      if (/bank|financial|accounting/.test(schemaJoined)) return makeClassification("services", "Finance & Banking", "Finance", "high");
      return makeClassification("services", "Professional Services", "Service", "high");
    }
  }

  // 3. High-authority Primary Identity (Domain structure + Business Name)
  const primaryMatch = classifyFromPrimaryIdentity(cleanDom, cleanName);
  if (primaryMatch) {
    // If rawCategory is non-generic and agrees with the primary vertical & sub-vertical (e.g. "5-star resort hotel"), keep its rich specific label
    if (rawCat && !isGenericCategory(rawCat)) {
      const mappedRaw = mapRawCategoryToCanonical(rawCat);
      if (mappedRaw === primaryMatch.canonicalId && deriveBadgeFromSpecific(rawCat, mappedRaw) === primaryMatch.badgeLabel) {
        return makeClassification(mappedRaw, rawCat, deriveBadgeFromSpecific(rawCat, mappedRaw), "high");
      }
    }
    return primaryMatch;
  }

  // 4. Rich Metadata Classification (description + keywords + name + domain)
  const metaMatch = classifyFromMetadataText(cleanDom, cleanName, cleanDesc, cleanKeywords);
  if (metaMatch) {
    if (rawCat && !isGenericCategory(rawCat)) {
      const mappedRaw = mapRawCategoryToCanonical(rawCat);
      // Only preserve rawCategory if it agrees with both canonical vertical & sub-vertical; otherwise trust fresh metadata!
      if (mappedRaw === metaMatch.canonicalId && deriveBadgeFromSpecific(rawCat, mappedRaw) === metaMatch.badgeLabel) {
        return makeClassification(mappedRaw, rawCat, deriveBadgeFromSpecific(rawCat, mappedRaw), "high");
      }
    }
    return metaMatch;
  }

  // 5. Existing specific (non-generic) rawCategory (e.g. curated OSM/DB category when description wasn't passed in search preview)
  if (rawCat && !isGenericCategory(rawCat)) {
    const mapped = mapRawCategoryToCanonical(rawCat);
    if (mapped) {
      return makeClassification(mapped, rawCat, deriveBadgeFromSpecific(rawCat, mapped), "medium");
    }
  }

  // 6. Honest unclassified fallback (flagged with isFallback: true so Search & Loading UI never show a bogus "Service" badge!)
  return makeClassification("services", "Business & Services", "Service", "low", true);
}

const SEEDED_COMMUNITY_REVIEW_IDS = new Set([
  // Wave 1 baseline reviews
  "rev_zara_apparel_01",
  "rev_dunkin_coffee_02",
  "rev_apple_tech_03",
  "rev_jollibee_food_04",
  "rev_uniqlo_clothing_05",
  "rev_art_coffee_06",
  "rev_dominos_pizza_07",
  "rev_hilton_hotel_08",
  "rev_calvin_klein_09",
  "rev_mcdonalds_meal_10",
  "rev_wolt_delivery_11",
  "rev_fourseasons_12",
  "rev_propercoffee_bakery_13",
  "rev_multipharma_14",
  "rev_sephora_cosmetics_15",
  "rev_seveneleven_16",
  "rev_autowerkplaats_17",
  "rev_pintoart_18",
  "rev_havanna_19",
  "rev_burgerking_meal_20",
  // Wave 2 baseline reviews
  "rev_lerner_21",
  "rev_refalo_22",
  "rev_nevada_legal_23",
  "rev_bclaw_24",
  "rev_healis_25",
  "rev_praktijk_26",
  "rev_hotel_julien_27",
  "rev_hoteldesgaleries_28",
  "rev_easyhotel_29",
  "rev_regalia_30",
  "rev_villaggio_31",
  "rev_makicafe_32",
  "rev_guardslip_33",
  "rev_noma_34",
  "rev_celler_35",
  "rev_batterymart_36",
  "rev_benchdepot_37",
  "rev_soluxecleaning_38",
  "rev_brightbeautiful_39",
  "rev_flipper_40",
]);

/**
 * Returns true if the review ID belongs to a baseline seeded review (Wave 1/2/3).
 * Any real user-snapped review (e.g. `rev-1795...`, `photo-...`) returns false.
 */
export function isSeededReviewId(id?: string | null): boolean {
  const clean = String(id || "").trim().toLowerCase();
  if (!clean) return false;
  if (clean.startsWith("rev_w3_") || clean.startsWith("seed_")) return true;
  return SEEDED_COMMUNITY_REVIEW_IDS.has(clean);
}

/**
 * Canonical latest-first ordering shared across Homepage "Live Photo Reviews",
 * "Explore all", and the Discover vertical feed:
 * - Real customer photo reviews ALWAYS come first in exact newest-first order.
 * - Baseline community reviews follow in exact newest-first chronological order.
 * Guarantees 100% identical order and strictly monotonic timestamps (zero time jumps).
 */
export function sortReviewsCanonicalLatestFirst<T>(
  items: T[],
  getId: (item: T) => string | undefined | null,
  getTimestampMs: (item: T) => number
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  return [...items].sort((a, b) => {
    const aOrganic = !isSeededReviewId(getId(a));
    const bOrganic = !isSeededReviewId(getId(b));
    if (aOrganic !== bOrganic) return aOrganic ? -1 : 1;
    return getTimestampMs(b) - getTimestampMs(a);
  });
}

/**
 * Ordering for Homepage "Live Photo Reviews" / Trending:
 * Strictly monotonic newest-first chronological order (identical to "Explore all" & Discover):
 * 1. EVERY real organic user-snapped photo review ALWAYS appears FIRST (#1, #2, #3...) newest-first.
 * 2. Baseline community reviews follow strictly newest-first (never jumping backwards in time).
 */
export function selectDiverseTrendingReviews<T>(
  sortedNewestFirst: T[],
  getCategoryId: (item: T) => ConcreteCategoryId,
  getTimestampMs: (item: T) => number,
  activeCategory: CanonicalCategoryId,
  isOrganicItem?: (item: T) => boolean
): T[] {
  if (!Array.isArray(sortedNewestFirst) || sortedNewestFirst.length === 0) return [];

  const checkOrganic = isOrganicItem || (() => true);

  const filtered =
    activeCategory === "all"
      ? sortedNewestFirst
      : sortedNewestFirst.filter((item) => getCategoryId(item) === activeCategory);

  const organicItems: T[] = [];
  const seededItems: T[] = [];
  for (const item of filtered) {
    if (checkOrganic(item)) organicItems.push(item);
    else seededItems.push(item);
  }

  organicItems.sort((a, b) => getTimestampMs(b) - getTimestampMs(a));
  seededItems.sort((a, b) => getTimestampMs(b) - getTimestampMs(a));

  return [...organicItems, ...seededItems];
}
