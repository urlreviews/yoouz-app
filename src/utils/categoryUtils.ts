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
}

const GENERIC_CATEGORY_SET = new Set([
  "",
  "website",
  "verified business",
  "business",
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

const KNOWN_DOMAIN_CATEGORIES: Record<string, CategoryClassification> = {
  // Hotels & Travel
  "hilton.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "marriott.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "hyatt.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "ihg.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "accor.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "fourseasons.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Luxury Hotel & Resort", badgeLabel: "Hotel" },
  "easyhotel.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" },
  "booking.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
  "airbnb.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Stays & Hospitality", badgeLabel: "Stay" },
  "expedia.com": { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotels & Travel", badgeLabel: "Travel" },
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
  "dominos.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Pizza & Fast Food", badgeLabel: "Restaurant" },
  "dunkindonuts.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "starbucks.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Coffee & Bakery", badgeLabel: "Cafe" },
  "doordash.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "wolt.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "ubereats.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "deliveroo.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Food & Delivery", badgeLabel: "Delivery" },
  "chipotle.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Restaurant & Dining", badgeLabel: "Restaurant" },
  "kfc.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "bk.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
  "subway.com": { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: "Fast Food Restaurant", badgeLabel: "Restaurant" },
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
  "ikea.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Home & Furniture Retail", badgeLabel: "Shopping" },
  "target.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Department Store", badgeLabel: "Shopping" },
  "walmart.com": { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Supermarket & Retail", badgeLabel: "Shopping" },
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

  // Tech & Software
  "apple.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Consumer Electronics & Tech", badgeLabel: "Tech" },
  "google.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Technology & Software", badgeLabel: "Tech" },
  "openai.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "AI & Software", badgeLabel: "Tech" },
  "anthropic.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "AI & Software", badgeLabel: "Tech" },
  "webflow.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Software & SaaS", badgeLabel: "Tech" },
  "whatsapp.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Messaging & Tech", badgeLabel: "Tech" },
  "veeva.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Enterprise Software", badgeLabel: "Tech" },
  "videoland.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Streaming & Media", badgeLabel: "Media" },
  "gundam-official.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Entertainment & Media", badgeLabel: "Media" },
  "researchgate.net": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Science & Tech Platform", badgeLabel: "Tech" },
  "gamanetworks.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "IT & Network Solutions", badgeLabel: "Tech" },
  "com.eg": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Telecom & Connectivity", badgeLabel: "Tech" },
  "yoouz.com": { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Live Photo Reviews Platform", badgeLabel: "Tech" },

  // Services (Legal, Cleaning, Finance, Healthcare, Facilities)
  "mamotcv.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Legal Services", badgeLabel: "Legal" },
  "bnpparibas.fr": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Banking & Finance", badgeLabel: "Finance" },
  "wowcleannyc.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "havenhomecleaning.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "highclasscleaning.co": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Home Services & Cleaning", badgeLabel: "Cleaning" },
  "aramark.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Hospitality & Facilities", badgeLabel: "Service" },
  "denieuwecirkel.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Healthcare & Medical", badgeLabel: "Health" },
  "ycombinator.com": { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Venture Capital & Finance", badgeLabel: "Finance" },
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

function deriveBadgeFromSpecific(specific: string, canonicalId: ConcreteCategoryId): string {
  const s = specific.toLowerCase();
  if (canonicalId === "hotels") {
    if (s.includes("airline") || s.includes("flight") || s.includes("travel") || s.includes("landmark") || s.includes("attraction")) {
      return "Travel";
    }
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
    if (s.includes("venture") || s.includes("bank") || s.includes("finance") || s.includes("invest")) return "Finance";
    if (s.includes("marketing") || s.includes("agency") || s.includes("creative")) return "Agency";
    return "Service";
  }
  if (canonicalId === "auto") return "Auto";
  if (canonicalId === "shopping") {
    if (s.includes("convenience") || s.includes("supermarket") || s.includes("grocery")) return "Retail";
    return "Shopping";
  }
  if (canonicalId === "tech") {
    if (s.includes("stream") || s.includes("media") || s.includes("entertain")) return "Media";
    return "Tech";
  }
  return "Product";
}

function mapRawCategoryToCanonical(rawCategory: string): ConcreteCategoryId | null {
  const c = rawCategory.trim().toLowerCase();
  if (!c || isGenericCategory(c)) return null;

  // Hotels & Travel
  if (/\b(hotel|resort|motel|hostel|lodging|hospitality|suites|stay|airline|flight|travel|tourism|landmark|attraction|museum|cultural)\b/i.test(c)) {
    if (/\bfacilities\b/i.test(c)) return "services";
    return "hotels";
  }
  // Restaurants, Cafes & Food
  if (/\b(restaurant|dining|fast food|pizza|pizzeria|cafe|café|coffee|bakery|pastry|bistro|brasserie|food|delivery|bar|lounge|nightlife|confectionery|sushi|burger|grill)\b/i.test(c)) {
    if (/\bconsumer goods|dairy\b/i.test(c)) return "products";
    return "restaurants";
  }
  // Beauty, Skincare & Wellness
  if (/\b(beauty|cosmetics|skincare|salon|hair|barber|spa|wellness|massage|grooming|optician|eyewear|fragrance|perfume)\b/i.test(c)) {
    return "beauty";
  }
  // Auto & Mobility
  if (/\b(auto|automotive|car|garage|mechanic|tire|tyre|gas station|fuel|mobility|ev|vehicle|dealership|motor)\b/i.test(c)) {
    return "auto";
  }
  // Tech, Software & Digital Platforms
  if (/\b(software|saas|ai\b|artificial intelligence|tech|technology|digital|telecom|network|it\s|app\b|platform|streaming|media|entertainment|gaming|science|cloud|cyber)\b/i.test(c)) {
    if (/\bconsumer electronics\b/i.test(c) && !/\btech\b/i.test(c)) return "products";
    return "tech";
  }
  // Products (Footwear, Watches, Appliances, Goods)
  if (/\b(product|footwear|sportswear|watch|watches|appliance|gadget|hardware|consumer goods|accessories|toys|electronics)\b/i.test(c)) {
    return "products";
  }
  // Shopping & Retail
  if (/\b(shopping|retail|e-commerce|ecommerce|store|boutique|mall|supermarket|hypermarket|convenience|grocery|apparel|clothing|fashion|furniture|department)\b/i.test(c)) {
    return "shopping";
  }
  // Services (Legal, Cleaning, Medical, Finance, Agencies, Real Estate, Trades, Education)
  if (/\b(service|legal|law|attorney|cleaning|plumb|hvac|repair|medical|health|clinic|dentist|dental|pharmacy|hospital|real estate|property|marketing|agency|creative|consulting|finance|bank|venture|capital|invest|insurance|education|university|school|logistics|shipping|office|industrial|fitness|gym|city or town hall)\b/i.test(c)) {
    return "services";
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

  // 1. Exact known domain match (highest precision for iconic brands & audited places)
  if (cleanDom && KNOWN_DOMAIN_CATEGORIES[cleanDom]) {
    const known = KNOWN_DOMAIN_CATEGORIES[cleanDom];
    // Preserve custom specific category if user/owner explicitly customized a non-generic one
    if (rawCat && !isGenericCategory(rawCat)) {
      const mappedFromRaw = mapRawCategoryToCanonical(rawCat);
      if (mappedFromRaw) {
        const meta = CANONICAL_CATEGORIES.find((m) => m.id === mappedFromRaw)!;
        return {
          canonicalId: mappedFromRaw,
          canonicalLabel: meta.label,
          specificCategory: rawCat,
          badgeLabel: deriveBadgeFromSpecific(rawCat, mappedFromRaw),
        };
      }
    }
    return known;
  }

  // 2. Existing specific (non-generic) rawCategory
  if (rawCat && !isGenericCategory(rawCat)) {
    const mapped = mapRawCategoryToCanonical(rawCat);
    if (mapped) {
      const meta = CANONICAL_CATEGORIES.find((m) => m.id === mapped)!;
      return {
        canonicalId: mapped,
        canonicalLabel: meta.label,
        specificCategory: rawCat,
        badgeLabel: deriveBadgeFromSpecific(rawCat, mapped),
      };
    }
  }

  // 3. Schema.org @type signals (from website metadata scraper)
  const schemaJoined = Array.isArray(input.schemaTypes) ? input.schemaTypes.join(" ").toLowerCase() : "";
  if (schemaJoined) {
    if (/\b(hotel|resort|motel|lodgingbusiness|bedandbreakfast|hostel|airline|travelagency)\b/.test(schemaJoined)) {
      return { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: "Hotel & Hospitality", badgeLabel: "Hotel" };
    }
    if (/\b(restaurant|foodestablishment|cafeorcoffeeshop|bakery|fastfoodrestaurant|barorpub|icecreamshop|winery)\b/.test(schemaJoined)) {
      const isCafe = /cafe|coffee|bakery/.test(schemaJoined);
      return { canonicalId: "restaurants", canonicalLabel: "Restaurants", specificCategory: isCafe ? "Coffee & Bakery" : "Restaurant & Dining", badgeLabel: isCafe ? "Cafe" : "Restaurant" };
    }
    if (/\b(beautysalon|dayspa|healthandbeautybusiness|hairsalon|nailsalon|optician)\b/.test(schemaJoined)) {
      return { canonicalId: "beauty", canonicalLabel: "Beauty", specificCategory: "Beauty & Wellness", badgeLabel: "Beauty" };
    }
    if (/\b(automotivebusiness|autorepair|autodealer|autorental|gasstation|carwash)\b/.test(schemaJoined)) {
      return { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto Repair & Mobility", badgeLabel: "Auto" };
    }
    if (/\b(product|brand)\b/.test(schemaJoined) && !/\borganization\b/.test(schemaJoined)) {
      return { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Products", badgeLabel: "Product" };
    }
    if (/\b(store|clothingstore|departmentstore|grocerystore|conveniencestore|shoppingcenter|furniturestore|shoestore|jewelrystore|sportinggoodsstore|electronicsstore)\b/.test(schemaJoined)) {
      return { canonicalId: "shopping", canonicalLabel: "Shopping", specificCategory: "Retail & Shopping", badgeLabel: "Shopping" };
    }
    if (/\b(softwareapplication|webapplication|mobileapplication|techarticle)\b/.test(schemaJoined)) {
      return { canonicalId: "tech", canonicalLabel: "Tech", specificCategory: "Technology & Software", badgeLabel: "Tech" };
    }
    if (/\b(legalservice|attorney|notary|accountingservice|financialservice|bankorcreditunion|realestateagent|medicalbusiness|dentist|physician|hospital|pharmacy|homeandconstructionbusiness|plumber|electrician|hvacbusiness|housepainter|movingcompany)\b/.test(schemaJoined)) {
      if (/legal|attorney|notary/.test(schemaJoined)) return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Legal Services", badgeLabel: "Legal" };
      if (/medical|dentist|physician|hospital|pharmacy/.test(schemaJoined)) return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Healthcare & Medical", badgeLabel: "Health" };
      if (/realestate/.test(schemaJoined)) return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Real Estate", badgeLabel: "Real Estate" };
      if (/bank|financial|accounting/.test(schemaJoined)) return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Finance & Banking", badgeLabel: "Finance" };
      return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Professional Services", badgeLabel: "Service" };
    }
  }

  // 4. Domain TLD & structural heuristics + rich multilingual metadata text classification
  const combined = [cleanDom, input.name || "", input.description || "", input.keywords || ""]
    .join(" ")
    .toLowerCase();

  // Venture Capital / Investment / Private Equity / Banking (very common in scraped business directory)
  if (
    /\.vc$|\.ventures$|\.capital$/i.test(cleanDom) ||
    /(ventures|capital|vc|equity|partners)\.(com|co|io|be|in|uk|org)$/i.test(cleanDom) ||
    /\b(venture capital|seed fund|early[- ]stage invest|pre[- ]seed|series a|private equity|portfolio management|investment firm|investment fund|angel invest|venture firm|venture studio|venture creation|b2b startups|back founders|backs.*founders|sfdr)\b/i.test(combined) ||
    /\b(bank|banking|bnp paribas|credit union|wealth management|mortgage|insurance)\b/i.test(combined)
  ) {
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Finance & Venture Capital", badgeLabel: "Finance" };
  }

  // Cleaning & Home Trades
  if (/\b(cleaning|maid service|deep clean|house clean|apartment clean|janitor|plumbing|plomberie|hvac|chauffage|sanitair|electrician|roofing|handyman|moving company|pest control|landscaping)\b/i.test(combined)) {
    const isCleaning = /clean|maid/.test(combined);
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: isCleaning ? "Home Services & Cleaning" : "Home & Trade Services", badgeLabel: isCleaning ? "Cleaning" : "Service" };
  }

  // Hotels, Resorts & Airlines / Travel
  if (/\b(hotel|resort|suites|motel|hostel|boutique stay|hospitality|flights to|airlines|airways|inflight|boarding|vacation rental|book your stay|landmark|eiffel tower|tourist attraction)\b/i.test(combined)) {
    const isTravel = /airline|airways|flights|inflight|eiffel|tourist|attraction/.test(combined);
    return { canonicalId: "hotels", canonicalLabel: "Hotels", specificCategory: isTravel ? "Airlines & Travel" : "Hotel & Hospitality", badgeLabel: isTravel ? "Travel" : "Hotel" };
  }

  // Restaurants, Cafes, Bakeries & Food Delivery
  if (/\b(restaurant|bistro|brasserie|pizzeria|pizza|sushi|burger|steakhouse|bakery|patisserie|pastry|coffee roaster|espresso|cafe|café|diner|food delivery|order food|takeout|takeaway|menu|catering)\b/i.test(combined)) {
    const isDelivery = /food delivery|order food|takeout|takeaway/.test(combined);
    const isCafe = /coffee|cafe|café|bakery|pastry|espresso/.test(combined);
    return {
      canonicalId: "restaurants",
      canonicalLabel: "Restaurants",
      specificCategory: isDelivery ? "Food & Delivery" : isCafe ? "Coffee & Bakery" : "Restaurant & Dining",
      badgeLabel: isDelivery ? "Delivery" : isCafe ? "Cafe" : "Restaurant",
    };
  }

  // Beauty, Skincare, Cosmetics, Salons & Wellness
  if (/\b(skincare|cosmetics|makeup|beauty|fragrance|perfume|hair salon|barbershop|nail salon|massage|day spa|wellness|facial|optiek|optician|opticien|eyewear|brillen|contactlenzen)\b/i.test(combined)) {
    const isSkin = /skincare|lotion|moisturiz|cleanser|balm|aftershave/.test(combined);
    const isSpa = /massage|day spa|wellness|facial/.test(combined);
    return {
      canonicalId: "beauty",
      canonicalLabel: "Beauty",
      specificCategory: isSkin ? "Skincare & Beauty" : isSpa ? "Spa & Wellness" : "Beauty & Cosmetics",
      badgeLabel: isSkin ? "Skincare" : isSpa ? "Wellness" : "Beauty",
    };
  }

  // Auto & Mobility
  if (/\b(auto repair|car service|car wash|car rental|rental car|auto rental|dealership|garage|mechanic|tire service|tyre|automotive|gas station|electric vehicle)\b/i.test(combined)) {
    return { canonicalId: "auto", canonicalLabel: "Auto", specificCategory: "Auto Repair & Mobility", badgeLabel: "Auto" };
  }

  // Legal Services
  if (/\b(law firm|attorney|lawyer|legal services|advocaat|avocat|solicitor|litigation|injury law|notary)\b/i.test(combined)) {
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Legal Services", badgeLabel: "Legal" };
  }

  // Healthcare, Dental & Medical
  if (/\b(dentist|dental|orthodont|tandarts|zahnarzt|pharmacy|apotheek|pharmacie|drugstore|medical clinic|hospital|doctor|physician|groepspraktijk|healthcare|physiotherapy|psychotherapy|chiropractor)\b/i.test(combined)) {
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Healthcare & Medical", badgeLabel: "Health" };
  }

  // Real Estate
  if (/\b(real estate|realtor|property management|properties for sale|apartments for rent|brokerage|immo)\b/i.test(combined)) {
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Real Estate", badgeLabel: "Real Estate" };
  }

  // Marketing & Creative Agencies
  if (/\b(marketing agency|digital agency|advertising agency|creative agency|branding agency|web design|seo agency|pr agency|media agency)\b/i.test(combined)) {
    return { canonicalId: "services", canonicalLabel: "Services", specificCategory: "Marketing & Creative Agency", badgeLabel: "Agency" };
  }

  // Shopping, Fashion, Marketplaces & Retail
  if (
    /\b(shopping|marketplace|online store|e-commerce|ecommerce|envío gratis|compre productos|ショッピング|通販|supermarket|hypermarket|convenience store|department store|boutique|jackets|knitwear|dresses|apparel|clothing store|fashion brand)\b/i.test(combined)
  ) {
    const isFashion = /jackets|knitwear|dresses|apparel|clothing|fashion/.test(combined);
    return {
      canonicalId: "shopping",
      canonicalLabel: "Shopping",
      specificCategory: isFashion ? "Fashion & Apparel" : "E-Commerce & Retail",
      badgeLabel: "Shopping",
    };
  }

  // Consumer Products (Watches, Footwear, Appliances, Hardware, Electronics)
  if (/\b(watches|timepiece|footwear|sneakers|shoes|sandals|shaver|groomer|headphone|speaker|playstation|controller|camera gear|home appliance|consumer electronics|sportswear)\b/i.test(combined)) {
    return { canonicalId: "products", canonicalLabel: "Products", specificCategory: "Consumer Products", badgeLabel: "Product" };
  }

  // Tech, AI, Software, Streaming, Telecom & Media
  if (
    /\b(artificial general intelligence|ai search|ai research|software|saas|cloud platform|enterprise|webflow|messenger|stay in touch|it solutions|network solutions|telecom|stream.*series|films en programma|streaming|gaming|developer|api platform|researchgate)\b/i.test(combined)
  ) {
    const isMedia = /stream.*series|films en programma|streaming|gundam|anime|movie|tv show/.test(combined);
    return {
      canonicalId: "tech",
      canonicalLabel: "Tech",
      specificCategory: isMedia ? "Streaming & Media" : "Technology & Software",
      badgeLabel: isMedia ? "Media" : "Tech",
    };
  }

  // Final clean fallback (never ugly "Website")
  return {
    canonicalId: "services",
    canonicalLabel: "Services",
    specificCategory: "Business & Services",
    badgeLabel: "Service",
  };
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
 * Ordering for Homepage "Live Photo Reviews" / Trending:
 * 1. EVERY real organic user-snapped photo review ALWAYS appears FIRST at slots #1, #2, #3...
 *    in strict newest-first chronological order (so the latest customer photo is ALWAYS #1).
 * 2. Baseline community reviews follow cleanly interleaved across distinct categories
 *    (Hotels, Dining, Products, Beauty, Auto, Services, Shopping, Tech) so the showcase
 *    immediately communicates multi-category breadth.
 */
export function selectDiverseTrendingReviews<T>(
  sortedNewestFirst: T[],
  getCategoryId: (item: T) => ConcreteCategoryId,
  _getTimestampMs: (item: T) => number,
  activeCategory: CanonicalCategoryId,
  isOrganicItem?: (item: T) => boolean
): T[] {
  if (!Array.isArray(sortedNewestFirst) || sortedNewestFirst.length === 0) return [];

  const checkOrganic = isOrganicItem || (() => true);

  // Split into organic real user reviews vs baseline seeded items (preserving newest-first order within each)
  const organicItems: T[] = [];
  const seededItems: T[] = [];
  for (const item of sortedNewestFirst) {
    if (checkOrganic(item)) organicItems.push(item);
    else seededItems.push(item);
  }

  if (activeCategory !== "all") {
    return [
      ...organicItems.filter((item) => getCategoryId(item) === activeCategory),
      ...seededItems.filter((item) => getCategoryId(item) === activeCategory),
    ];
  }

  // On "All": ALWAYS place ALL real user photo reviews first in exact latest-first order!
  const result: T[] = [...organicItems];
  const used = new Set<T>(organicItems);

  // Interleave baseline seeded showcase reviews cleanly across categories after the real user reviews
  const buckets = new Map<ConcreteCategoryId, T[]>();
  for (const item of seededItems) {
    const cat = getCategoryId(item);
    const list = buckets.get(cat);
    if (list) list.push(item);
    else buckets.set(cat, [item]);
  }

  const showcaseOrder: ConcreteCategoryId[] = [
    "hotels",
    "restaurants",
    "products",
    "beauty",
    "auto",
    "services",
    "shopping",
    "tech",
  ];

  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (const catId of showcaseOrder) {
      const list = buckets.get(catId);
      while (list && list.length > 0) {
        const candidate = list.shift()!;
        if (!used.has(candidate)) {
          used.add(candidate);
          result.push(candidate);
          madeProgress = true;
          break;
        }
      }
    }
  }

  // Append any leftovers defensively
  for (const item of seededItems) {
    if (!used.has(item)) {
      result.push(item);
    }
  }

  return result;
}
