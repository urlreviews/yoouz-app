import fs from "fs";
import path from "path";
import sharp from "sharp";
import { getBunnyDb } from "../lib/bunny-db";
import { generateGoogleLetterAvatarSvg } from "../lib/avatar";
import { VideoReview, UserProfile } from "../types";

export interface SeedReviewer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  handle: string;
  email: string;
  bio: string;
  city: string;
  country: string;
  passkeyProtected: boolean;
  isVerified: boolean;
  isLocalGuide: boolean;
  videoReviewCount: number;
  photosCount: number;
  likesCount?: number;
}

export interface SeedPhotoReviewDef {
  reviewId: string;
  placeId: string;
  placeName: string;
  category: string;
  rating: number;
  sourceImage: string;
  dishOrItem: string;
  caption: string;
  reviewerId: string;
  likesCount: number;
  bookmarksCount: number;
  sharesCount: number;
  commentsCount: number;
  viewsCount: number;
  daysAgo: number;
}

export const COMMUNITY_REVIEWERS: SeedReviewer[] = [
  {
    id: "usr_sofia_rossi",
    name: "Sofia Rossi",
    firstName: "Sofia",
    lastName: "Rossi",
    handle: "@sofiarossi",
    email: "sofia.rossi@community.yoouz.internal",
    bio: "Visual storyteller & fashion buyer. Obsessed with natural fabrics, quiet tailoring, and morning espressos.",
    city: "Milan",
    country: "Italy",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 3,
    photosCount: 3,
  },
  {
    id: "usr_olivia_bennett",
    name: "Olivia Bennett",
    firstName: "Olivia",
    lastName: "Bennett",
    handle: "@oliviab",
    email: "olivia.bennett@community.yoouz.internal",
    bio: "Architectural designer & specialty cafe hunter. Documenting morning light and neighborhood roasteries.",
    city: "Boston, MA",
    country: "United States",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_marcus_sterling",
    name: "Marcus",
    firstName: "Marcus",
    lastName: "",
    handle: "@marcus",
    email: "marcus.sterling@community.yoouz.internal",
    bio: "Software architect & hardware tinkerer. Candid tech setups, battery tests, and everyday carry gear.",
    city: "San Francisco, CA",
    country: "United States",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: false,
    videoReviewCount: 4,
    photosCount: 4,
  },
  {
    id: "usr_noah_tremblay",
    name: "U/FCC8RS",
    firstName: "U/FCC8RS",
    lastName: "",
    handle: "@u_fcc8rs",
    email: "noah.tremblay@community.yoouz.internal",
    bio: "Street food enthusiast & cultural traveler. Searching for the crispest skin, warmest broths, and secret stalls.",
    city: "Manila",
    country: "Philippines",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: true,
    videoReviewCount: 3,
    photosCount: 3,
  },
  {
    id: "usr_emma_klein",
    name: "U/6VUMW5",
    firstName: "U/6VUMW5",
    lastName: "",
    handle: "@u_6vumw5",
    email: "emma.klein@community.yoouz.internal",
    bio: "Minimalist creative director. Passionate about sustainable textiles, functional daily wear, and clean silhouettes.",
    city: "Berlin",
    country: "Germany",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: false,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_maya_lin",
    name: "Maya",
    firstName: "Maya",
    lastName: "",
    handle: "@maya",
    email: "maya.lin@community.yoouz.internal",
    bio: "Printmaker & watercolorist. Finding solace in quiet bookish cafes, oat flat whites, and flaky pastries.",
    city: "Aberdeen",
    country: "United Kingdom",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: true,
    videoReviewCount: 1,
    photosCount: 1,
  },
  {
    id: "usr_liam_oconnor",
    name: "U/Y3AJHN",
    firstName: "U/Y3AJHN",
    lastName: "",
    handle: "@u_y3ajhn",
    email: "liam.oconnor@community.yoouz.internal",
    bio: "Urban runner & neighborhood pizza historian. Always tracking the golden crust ratio and fresh mozzarella.",
    city: "Chicago, IL",
    country: "United States",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: false,
    videoReviewCount: 5,
    photosCount: 5,
  },
  {
    id: "usr_elena_rostova",
    name: "Elena R",
    firstName: "Elena",
    lastName: "R",
    handle: "@elenar",
    email: "elena.rostova@community.yoouz.internal",
    bio: "Hospitality consultant & boutique hotel reviewer. Exploring tranquil sanctuaries and thoughtful room design.",
    city: "Zurich",
    country: "Switzerland",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 4,
    photosCount: 4,
  },
  {
    id: "usr_lucas_silva",
    name: "U/J4DCGH",
    firstName: "U/J4DCGH",
    lastName: "",
    handle: "@u_j4dcgh",
    email: "lucas.silva@community.yoouz.internal",
    bio: "Denim collector & vintage camera shooter. Highlighting raw selvedge, heritage jackets, and craftsmanship.",
    city: "São Paulo",
    country: "Brazil",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: false,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_isabella_gomez",
    name: "Isabella Gomez",
    firstName: "Isabella",
    lastName: "Gomez",
    handle: "@isabellag",
    email: "isabella.gomez@community.yoouz.internal",
    bio: "Ocean swimmer, road-tripper, and casual foodie. Loving late-night burger spots and roadside diner classics.",
    city: "Miami, FL",
    country: "United States",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 3,
    photosCount: 3,
  },
  {
    id: "usr_david_chen",
    name: "David C",
    firstName: "David",
    lastName: "C",
    handle: "@davidc",
    email: "david.chen@community.yoouz.internal",
    bio: "Full-stack dev & nocturnal eater. Testing on-demand delivery speeds, noodle packaging, and rainy day comfort food.",
    city: "Helsinki",
    country: "Finland",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: false,
    videoReviewCount: 1,
    photosCount: 1,
  },
  {
    id: "usr_zoe_almansoor",
    name: "Zoe",
    firstName: "Zoe",
    lastName: "",
    handle: "@zoe",
    email: "zoe.almansoor@community.yoouz.internal",
    bio: "Global luxury travel curator. Documenting iconic atrium lounges, sparkling mocktails, and world-class service.",
    city: "Dubai",
    country: "United Arab Emirates",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 4,
    photosCount: 4,
  },
  {
    id: "usr_chloe_vance",
    name: "U/FSQUT7",
    firstName: "U/FSQUT7",
    lastName: "",
    handle: "@u_fsqut7",
    email: "chloe.vance@community.yoouz.internal",
    bio: "Literature graduate & tea collector. Searching for hidden independent bookshops with warm bakeries attached.",
    city: "Edinburgh",
    country: "United Kingdom",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: true,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_gabriel_moreau",
    name: "U/GAJSAJ",
    firstName: "U/GAJSAJ",
    lastName: "",
    handle: "@u_gajsaj",
    email: "gabriel.moreau@community.yoouz.internal",
    bio: "Biochemist & dermo-cosmetic researcher. Honest barrier-first skincare reviews and pharmacy recommendations.",
    city: "Brussels",
    country: "Belgium",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 3,
    photosCount: 3,
  },
  {
    id: "usr_aiko_tanaka",
    name: "Aiko Tanaka",
    firstName: "Aiko",
    lastName: "Tanaka",
    handle: "@aikotanaka",
    email: "aiko.tanaka@community.yoouz.internal",
    bio: "Skincare formulator & beauty journalist. Sharing honest swatch tests, skin-feel textures, and hydration serums.",
    city: "Tokyo",
    country: "Japan",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 5,
    photosCount: 5,
  },
  {
    id: "usr_kenji_sato",
    name: "U/MXPMZ5",
    firstName: "U/MXPMZ5",
    lastName: "",
    handle: "@u_mxpmz5",
    email: "kenji.sato@community.yoouz.internal",
    bio: "Tokyo city walker & convenience store connoisseur. Loving hot can coffees, daily onigiri, and train station bites.",
    city: "Tokyo",
    country: "Japan",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: false,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_dries_vandamme",
    name: "U/HE33FZ",
    firstName: "U/HE33FZ",
    lastName: "",
    handle: "@u_he33fz",
    email: "dries.vandamme@community.yoouz.internal",
    bio: "Classic car restorer & garage gearhead. Checking workshop honesty, clean bay mechanics, and engine maintenance.",
    city: "Bruges",
    country: "Belgium",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 3,
    photosCount: 3,
  },
  {
    id: "usr_maria_santos",
    name: "U/FGSPX6",
    firstName: "U/FGSPX6",
    lastName: "",
    handle: "@u_fgspx6",
    email: "maria.santos@community.yoouz.internal",
    bio: "Botanical illustrator & museum wanderer. Capturing natural daylight in open courtyards and sculpture gardens.",
    city: "Antipolo",
    country: "Philippines",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: true,
    videoReviewCount: 4,
    photosCount: 4,
  },
  {
    id: "usr_mateo_fernandez",
    name: "U/QAB43B",
    firstName: "U/QAB43B",
    lastName: "",
    handle: "@u_qab43b",
    email: "mateo.fernandez@community.yoouz.internal",
    bio: "Tango guitarist & traditional porteño cafe regular. Seeking the richest dulce de leche and authentic espresso.",
    city: "Buenos Aires",
    country: "Argentina",
    passkeyProtected: false,
    isVerified: false,
    isLocalGuide: false,
    videoReviewCount: 2,
    photosCount: 2,
  },
  {
    id: "usr_alex_carter",
    name: "Jack T",
    firstName: "Jack",
    lastName: "T",
    handle: "@jackt",
    email: "alex.carter@community.yoouz.internal",
    bio: "Live music sound technician & burger explorer. Always hunting flame-grilled patties, fresh pickles, and cold drinks.",
    city: "Austin, TX",
    country: "United States",
    passkeyProtected: true,
    isVerified: true,
    isLocalGuide: false,
    videoReviewCount: 3,
    photosCount: 3,
  },
];

export const COMMUNITY_REVIEWS_DEF: SeedPhotoReviewDef[] = [
  {
    reviewId: "rev_zara_apparel_01",
    placeId: "zara.com",
    placeName: "Zara",
    category: "Fashion & Apparel",
    rating: 5,
    sourceImage: "zara_apparel_review_1794859001521.jpg",
    dishOrItem: "Tailored Trench Coat",
    caption: "Found this timeless tailored trench coat in-store today. Fabric drape and stitching feel incredible for everyday layering.",
    reviewerId: "usr_sofia_rossi",
    likesCount: 142,
    bookmarksCount: 68,
    sharesCount: 19,
    commentsCount: 12,
    viewsCount: 1240,
    daysAgo: 1,
  },
  {
    reviewId: "rev_dunkin_coffee_02",
    placeId: "dunkindonuts.com",
    placeName: "Dunkin' Donuts",
    category: "Coffee & Bakery",
    rating: 5,
    sourceImage: "dunkin_coffee_review_1794859002003.jpg",
    dishOrItem: "Iced Caramel Brew & Glazed Donut",
    caption: "Morning routine sorted. Iced caramel swirl brew with oat milk and a fresh warm glazed ring. Always quick service.",
    reviewerId: "usr_olivia_bennett",
    likesCount: 98,
    bookmarksCount: 34,
    sharesCount: 11,
    commentsCount: 8,
    viewsCount: 890,
    daysAgo: 2,
  },
  {
    reviewId: "rev_apple_tech_03",
    placeId: "apple.com",
    placeName: "Apple",
    category: "Consumer Electronics & Tech",
    rating: 5,
    sourceImage: "apple_tech_review_1794859003158.jpg",
    dishOrItem: "MacBook Air & Ecosystem Setup",
    caption: "The M3 MacBook Air battery life easily lasts through a full day of mobile coding and meetings without touching the charger.",
    reviewerId: "usr_marcus_sterling",
    likesCount: 215,
    bookmarksCount: 92,
    sharesCount: 37,
    commentsCount: 24,
    viewsCount: 2450,
    daysAgo: 2,
  },
  {
    reviewId: "rev_jollibee_food_04",
    placeId: "jollibee.com.ph",
    placeName: "Jollibee",
    category: "Fast Food Restaurant",
    rating: 5,
    sourceImage: "jollibee_food_review_1794859002900.jpg",
    dishOrItem: "Spicy Chickenjoy & Gravy",
    caption: "Nothing beats two pieces of spicy Chickenjoy with that warm savory dipping gravy and steamed rice. Extra crispy skin every time.",
    reviewerId: "usr_noah_tremblay",
    likesCount: 176,
    bookmarksCount: 45,
    sharesCount: 28,
    commentsCount: 15,
    viewsCount: 1680,
    daysAgo: 3,
  },
  {
    reviewId: "rev_uniqlo_clothing_05",
    placeId: "uniqlo.com",
    placeName: "Uniqlo US",
    category: "Apparel & Clothing",
    rating: 5,
    sourceImage: "uniqlo_clothing_review_1794859004327.jpg",
    dishOrItem: "SUPIMA Cotton Crew Necks",
    caption: "Stocked up on the SUPIMA cotton tees. The pastel tones wash well without losing their silhouette or collar shape.",
    reviewerId: "usr_emma_klein",
    likesCount: 112,
    bookmarksCount: 51,
    sharesCount: 14,
    commentsCount: 9,
    viewsCount: 1040,
    daysAgo: 4,
  },
  {
    reviewId: "rev_art_coffee_06",
    placeId: "propercoffee.app",
    placeName: "Art Coffee Gallery Aberdeen",
    category: "Restaurant & Cafe",
    rating: 5,
    sourceImage: "art_coffee_review_1794859004909.jpg",
    dishOrItem: "Artisanal Flat White & Croissant",
    caption: "Velvety oat flat white with intricate tulip art paired with a flaky butter croissant. My favorite quiet corner in town.",
    reviewerId: "usr_maya_lin",
    likesCount: 88,
    bookmarksCount: 39,
    sharesCount: 8,
    commentsCount: 7,
    viewsCount: 720,
    daysAgo: 4,
  },
  {
    reviewId: "rev_dominos_pizza_07",
    placeId: "dominos.com",
    placeName: "Domino's Pizza",
    category: "Pizza & Fast Food",
    rating: 5,
    sourceImage: "dominos_pizza_review_1794859005290.jpg",
    dishOrItem: "Hand-Tossed Pepperoni Pizza",
    caption: "Classic hand-tossed pepperoni with garlic-seasoned crust. Hot cheese pull right out of the box and arrived in under 20 minutes.",
    reviewerId: "usr_liam_oconnor",
    likesCount: 135,
    bookmarksCount: 42,
    sharesCount: 16,
    commentsCount: 11,
    viewsCount: 1310,
    daysAgo: 5,
  },
  {
    reviewId: "rev_hilton_hotel_08",
    placeId: "hilton.com",
    placeName: "Hilton Hotels",
    category: "Hotel & Hospitality",
    rating: 5,
    sourceImage: "hotel_resort_review_1794859004235.jpg",
    dishOrItem: "King Deluxe Suite",
    caption: "Crisp white linens, morning sun streaming through the floor-to-ceiling windows, and complete silence for a restful night.",
    reviewerId: "usr_elena_rostova",
    likesCount: 164,
    bookmarksCount: 87,
    sharesCount: 22,
    commentsCount: 14,
    viewsCount: 1590,
    daysAgo: 6,
  },
  {
    reviewId: "rev_calvin_klein_09",
    placeId: "calvinklein.com",
    placeName: "Calvin Klein® USA",
    category: "Apparel & Fashion",
    rating: 5,
    sourceImage: "calvin_klein_review_1794859090079.jpg",
    dishOrItem: "Denim Trucker Jacket & Jeans",
    caption: "Sturdy black denim trucker jacket and clean-taper jeans. High quality heavyweight denim that holds its cut perfectly.",
    reviewerId: "usr_lucas_silva",
    likesCount: 94,
    bookmarksCount: 37,
    sharesCount: 12,
    commentsCount: 6,
    viewsCount: 880,
    daysAgo: 7,
  },
  {
    reviewId: "rev_mcdonalds_meal_10",
    placeId: "mcdonalds.com",
    placeName: "McDonald's",
    category: "Fast Food Restaurant",
    rating: 5,
    sourceImage: "mcdonalds_meal_review_1794859091100.jpg",
    dishOrItem: "Double Cheeseburger & Golden Fries",
    caption: "Double cheeseburger combo with piping hot fries salted just right and an ice-cold fountain soda. Pure comfort.",
    reviewerId: "usr_isabella_gomez",
    likesCount: 189,
    bookmarksCount: 58,
    sharesCount: 25,
    commentsCount: 18,
    viewsCount: 1950,
    daysAgo: 8,
  },
  {
    reviewId: "rev_wolt_delivery_11",
    placeId: "wolt.com",
    placeName: "Wolt Delivery",
    category: "Food & Delivery",
    rating: 5,
    sourceImage: "wolt_delivery_review_1794859091862.jpg",
    dishOrItem: "Spicy Miso Ramen & Gyozas",
    caption: "Ordered from the noodle bar across town. Arrived in 22 minutes still steaming hot with broth packed separately.",
    reviewerId: "usr_david_chen",
    likesCount: 107,
    bookmarksCount: 46,
    sharesCount: 15,
    commentsCount: 8,
    viewsCount: 970,
    daysAgo: 9,
  },
  {
    reviewId: "rev_fourseasons_12",
    placeId: "fourseasons.com",
    placeName: "Four Seasons",
    category: "Luxury Hotel & Lounge",
    rating: 5,
    sourceImage: "fourseasons_hotel_review_1794859094287.jpg",
    dishOrItem: "Garden Lounge Refreshment",
    caption: "Afternoon sparkling refreshments in the quiet garden lounge. Impeccable personalized service and marble interior finishes.",
    reviewerId: "usr_zoe_almansoor",
    likesCount: 228,
    bookmarksCount: 110,
    sharesCount: 34,
    commentsCount: 19,
    viewsCount: 2600,
    daysAgo: 10,
  },
  {
    reviewId: "rev_propercoffee_bakery_13",
    placeId: "booksandbeans.co.uk",
    placeName: "Books And Beans",
    category: "Cafe & Bookstore",
    rating: 5,
    sourceImage: "propercoffee_bakery_review_1794859092266.jpg",
    dishOrItem: "Almond Pastry & Ceremonial Matcha",
    caption: "Warm toasted almond pastry alongside an earthy ceremonial matcha latte. The coziest place to read on a rainy afternoon.",
    reviewerId: "usr_chloe_vance",
    likesCount: 123,
    bookmarksCount: 64,
    sharesCount: 17,
    commentsCount: 10,
    viewsCount: 1130,
    daysAgo: 11,
  },
  {
    reviewId: "rev_multipharma_14",
    placeId: "multipharma.be",
    placeName: "Multipharma",
    category: "Pharmacy & Healthcare",
    rating: 5,
    sourceImage: "multipharma_wellness_review_1794859092864.jpg",
    dishOrItem: "Hydrating Barrier Repair Serum",
    caption: "Pharmacist recommended this barrier repair serum for seasonal dryness. Absorbs immediately without grease and soothes redness.",
    reviewerId: "usr_gabriel_moreau",
    likesCount: 91,
    bookmarksCount: 48,
    sharesCount: 9,
    commentsCount: 5,
    viewsCount: 830,
    daysAgo: 12,
  },
  {
    reviewId: "rev_sephora_cosmetics_15",
    placeId: "sephora.com",
    placeName: "Sephora",
    category: "Beauty & Cosmetics",
    rating: 5,
    sourceImage: "sephora_cosmetics_review_1794859349370.jpg",
    dishOrItem: "Velvet Matte Lipstick & Glow Serum",
    caption: "Tested the velvet matte lipstick and hydrating glow serum. The pigment payoff is rich and stays comfortable all day.",
    reviewerId: "usr_aiko_tanaka",
    likesCount: 245,
    bookmarksCount: 130,
    sharesCount: 41,
    commentsCount: 26,
    viewsCount: 2890,
    daysAgo: 1,
  },
  {
    reviewId: "rev_seveneleven_16",
    placeId: "7-eleven.com",
    placeName: "7-Eleven",
    category: "Convenience Store",
    rating: 5,
    sourceImage: "seveneleven_snack_review_1794859366687.jpg",
    dishOrItem: "Iced Roast Coffee & Onigiri",
    caption: "Quick afternoon pitstop: chilled iced roast coffee with a fresh tuna mayo onigiri. Flawless quality and fast checkout.",
    reviewerId: "usr_kenji_sato",
    likesCount: 154,
    bookmarksCount: 44,
    sharesCount: 21,
    commentsCount: 13,
    viewsCount: 1470,
    daysAgo: 2,
  },
  {
    reviewId: "rev_autowerkplaats_17",
    placeId: "autowerkplaatsbrugge.be",
    placeName: "Auto Werkplaats Brugge",
    category: "Auto Repair & Garage",
    rating: 5,
    sourceImage: "autowerkplaats_car_review_1794859384003.jpg",
    dishOrItem: "Synthetic Oil & Safety Inspection",
    caption: "Full synthetic oil service and multi-point safety check done in 45 minutes. Transparent pricing and genuine mechanics.",
    reviewerId: "usr_dries_vandamme",
    likesCount: 82,
    bookmarksCount: 31,
    sharesCount: 7,
    commentsCount: 4,
    viewsCount: 760,
    daysAgo: 3,
  },
  {
    reviewId: "rev_pintoart_18",
    placeId: "pintoartmuseum.ph",
    placeName: "Pinto Art Museum",
    category: "Art Museum & Cultural Center",
    rating: 5,
    sourceImage: "pintoart_museum_review_1794859400183.jpg",
    dishOrItem: "Courtyard Gallery Walk",
    caption: "The serene stone courtyards and open-air galleries are mesmerizing. Every doorway frames natural light and greenery.",
    reviewerId: "usr_maria_santos",
    likesCount: 198,
    bookmarksCount: 97,
    sharesCount: 33,
    commentsCount: 16,
    viewsCount: 2140,
    daysAgo: 4,
  },
  {
    reviewId: "rev_havanna_19",
    placeId: "havanna.com",
    placeName: "Havanna",
    category: "Cafe & Confectionery",
    rating: 5,
    sourceImage: "havanna_cafe_review_1794859415918.jpg",
    dishOrItem: "Dulce de Leche Alfajor & Espresso",
    caption: "A double espresso with the classic dark chocolate dulce de leche alfajor at the outdoor terrace. The gold standard.",
    reviewerId: "usr_mateo_fernandez",
    likesCount: 139,
    bookmarksCount: 56,
    sharesCount: 18,
    commentsCount: 11,
    viewsCount: 1380,
    daysAgo: 5,
  },
  {
    reviewId: "rev_burgerking_meal_20",
    placeId: "bk.com",
    placeName: "Burger King",
    category: "Fast Food Restaurant",
    rating: 5,
    sourceImage: "burgerking_meal_review_1794859430739.jpg",
    dishOrItem: "Flame-Grilled Double Whopper Meal",
    caption: "Flame-grilled double Whopper loaded with crisp veggies, hot salted fries, and an ice-cold drink. Hit the spot perfectly.",
    reviewerId: "usr_alex_carter",
    likesCount: 167,
    bookmarksCount: 53,
    sharesCount: 24,
    commentsCount: 14,
    viewsCount: 1720,
    daysAgo: 6,
  },
];

export async function seedAuthenticCommunity(options: { force?: boolean } = {}): Promise<{
  usersCount: number;
  reviewsCount: number;
  message: string;
}> {
  const db = getBunnyDb();
  if (!db) {
    throw new Error("BunnyDB database client unavailable");
  }

  const rootDir = process.cwd();
  const uploadsDir = path.join(rootDir, "uploads");
  const photosDir = path.join(uploadsDir, "photos");
  const publicPhotosDir = path.join(rootDir, "public", "uploads", "photos");
  const assetsImagesDir = path.join(rootDir, "src", "assets", "images");

  if (!fs.existsSync(photosDir)) fs.mkdirSync(photosDir, { recursive: true });
  if (!fs.existsSync(publicPhotosDir)) fs.mkdirSync(publicPhotosDir, { recursive: true });

  // 1. Ensure review_photos table exists in SQLite
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS review_photos (
      filename TEXT PRIMARY KEY,
      reviewId TEXT,
      dataUrl TEXT,
      mimeType TEXT DEFAULT 'image/jpeg',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
  } catch (e) {
    // ignore
  }

  // 2. Fetch existing places to enrich reviews with authentic logos, banners, address
  const placesRows = await db.execute("SELECT id, name, category, brandDomain, city, country, logoUrl, bannerUrl, website FROM places");
  const placesMap = new Map<string, any>();
  for (const r of placesRows.rows) {
    placesMap.set(String(r.id), r);
    if (r.brandDomain) placesMap.set(String(r.brandDomain), r);
  }

  // 3. Insert / update the 20 User Accounts
  const usersToSave: UserProfile[] = [];
  for (const reviewer of COMMUNITY_REVIEWERS) {
    const avatarSvg = generateGoogleLetterAvatarSvg(reviewer.name, 128, reviewer.handle);
    const userProfile: UserProfile & { username?: string } = {
      id: reviewer.id,
      name: reviewer.name,
      username: reviewer.name,
      firstName: reviewer.firstName,
      lastName: reviewer.lastName,
      handle: reviewer.handle,
      email: reviewer.email,
      bio: reviewer.bio,
      city: reviewer.city,
      country: reviewer.country,
      avatar: avatarSvg,
      isVerified: reviewer.isVerified,
      passkeyProtected: reviewer.passkeyProtected,
      videoReviewCount: reviewer.videoReviewCount,
      role: "creator",
      memberSince: "Nov 2024",
      yoouzPhotoUser: true,
      followersCount: Math.floor(reviewer.likesCount ? reviewer.likesCount * 1.5 : 45),
      followingCount: Math.floor(Math.random() * 20) + 10,
    };
    usersToSave.push(userProfile);

    // Save into SQLite users table
    try {
      await db.execute({
        sql: `INSERT INTO users (id, email, name, firstName, lastName, avatar, bio, role, data, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'creator', ?, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                firstName = excluded.firstName,
                lastName = excluded.lastName,
                avatar = excluded.avatar,
                bio = excluded.bio,
                data = excluded.data,
                updatedAt = CURRENT_TIMESTAMP`,
        args: [
          reviewer.id,
          reviewer.email,
          reviewer.name,
          reviewer.firstName,
          reviewer.lastName,
          avatarSvg,
          reviewer.bio,
          JSON.stringify(userProfile),
        ],
      });
    } catch (err) {
      console.warn(`[Seeder] Notice updating user ${reviewer.id}:`, err);
    }
  }

  // 4. Update Category in places table for seeded businesses
  const categoryUpdates = [
    { id: "zara.com", cat: "Fashion & Apparel" },
    { id: "dunkindonuts.com", cat: "Coffee & Bakery" },
    { id: "uniqlo.com", cat: "Apparel & Clothing" },
    { id: "dominos.com", cat: "Pizza & Fast Food" },
    { id: "calvinklein.com", cat: "Apparel & Fashion" },
    { id: "wolt.com", cat: "Food & Delivery" },
    { id: "sephora.com", cat: "Beauty & Cosmetics" },
    { id: "pintoartmuseum.ph", cat: "Art Museum & Cultural Center" },
    { id: "havanna.com", cat: "Cafe & Confectionery" },
  ];
  for (const update of categoryUpdates) {
    try {
      await db.execute({
        sql: `UPDATE places SET category = ? WHERE id = ? OR brandDomain = ?`,
        args: [update.cat, update.id, update.id],
      });
    } catch (e) {}
  }

  // 5. Process and seed each of the 20 Photo Reviews
  const reviewsToSave: VideoReview[] = [];
  const now = Date.now();

  for (const def of COMMUNITY_REVIEWS_DEF) {
    const reviewer = COMMUNITY_REVIEWERS.find((u) => u.id === def.reviewerId)!;
    const reviewerAvatar = generateGoogleLetterAvatarSvg(reviewer.name, 128, reviewer.handle);
    const matchedPlace = placesMap.get(def.placeId) || {};

    const sourcePath = path.join(assetsImagesDir, def.sourceImage);
    const safePlaceSlug = def.placeId.replace(/[^a-zA-Z0-9]/g, "_");
    const photoFilename = `${def.reviewId}_${safePlaceSlug}.jpg`;
    const destPhotoPath = path.join(photosDir, photoFilename);
    const destPublicPhotoPath = path.join(publicPhotosDir, photoFilename);

    let photoDataUrl = "";

    // Convert & optimize photo with sharp
    if (fs.existsSync(sourcePath)) {
      try {
        const processedBuffer = await sharp(sourcePath)
          .resize(720, 1280, { fit: "cover", position: "center" })
          .jpeg({ quality: 88, progressive: true })
          .toBuffer();

        fs.writeFileSync(destPhotoPath, processedBuffer);
        fs.writeFileSync(destPublicPhotoPath, processedBuffer);

        photoDataUrl = `data:image/jpeg;base64,${processedBuffer.toString("base64")}`;

        // Persist to review_photos table in SQLite
        await db.execute({
          sql: `INSERT INTO review_photos (filename, reviewId, dataUrl, mimeType)
                VALUES (?, ?, ?, 'image/jpeg')
                ON CONFLICT(filename) DO UPDATE SET dataUrl = excluded.dataUrl, updatedAt = CURRENT_TIMESTAMP`,
          args: [photoFilename, def.reviewId, photoDataUrl],
        });
      } catch (sharpErr) {
        console.error(`[Seeder] Error processing image ${def.sourceImage}:`, sharpErr);
      }
    } else {
      console.warn(`[Seeder] Source image not found: ${sourcePath}`);
    }

    const reviewCreatedAtMs = now - def.daysAgo * 86400 * 1000 - Math.floor(Math.random() * 3600 * 1000);
    const photoUrl = `/uploads/photos/${photoFilename}`;

    const reviewRecord: VideoReview = {
      id: def.reviewId,
      mediaType: "photo",
      photoUrl,
      thumbnailUrl: photoUrl,
      videoUrl: "",
      photoDataUrl: photoDataUrl || undefined,
      userId: reviewer.id,
      userEmail: reviewer.email,
      createdAtMs: reviewCreatedAtMs,
      createdAt: new Date(reviewCreatedAtMs).toISOString(),
      recordedAt: new Date(reviewCreatedAtMs).toISOString(),
      isLocalUpload: true,
      placeId: def.placeId,
      placeName: matchedPlace.name || def.placeName,
      placeCategory: def.category || matchedPlace.category,
      placeAddress: matchedPlace.address || "",
      placeCity: matchedPlace.city || reviewer.city,
      placeCountry: matchedPlace.country || reviewer.country,
      placeRating: 5,
      placeWebsite: matchedPlace.website || `https://${def.placeId}`,
      placeLogoUrl: matchedPlace.logoUrl || undefined,
      placeBannerUrl: matchedPlace.bannerUrl || undefined,
      authorName: reviewer.name,
      authorAvatar: reviewerAvatar,
      author: {
        id: reviewer.id,
        userId: reviewer.id,
        name: reviewer.name,
        firstName: reviewer.firstName,
        lastName: reviewer.lastName,
        handle: reviewer.handle,
        email: reviewer.email,
        avatar: reviewerAvatar,
        bio: reviewer.bio,
        location: `${reviewer.city}, ${reviewer.country}`,
        city: reviewer.city,
        country: reviewer.country,
        isVerified: reviewer.isVerified,
        passkeyProtected: reviewer.passkeyProtected,
        isLocalGuide: reviewer.isLocalGuide,
        videoReviewCount: reviewer.videoReviewCount,
        photosCount: reviewer.photosCount,
      },
      rating: 5,
      caption: def.caption,
      description: def.caption,
      dishOrItem: def.dishOrItem,
      likes: def.likesCount,
      bookmarksCount: def.bookmarksCount,
      sharesCount: def.sharesCount,
      commentsCount: def.commentsCount,
      views: def.viewsCount,
      viewsCount: def.viewsCount,
      tags: [def.dishOrItem, def.category, "PhotoReview"],
      isLandscape: false,
      aspectRatio: 9 / 16,
      isReady: true,
      isProcessing: false,
    };

    reviewsToSave.push(reviewRecord);

    // Persist to videoReviews table in SQLite
    try {
      await db.execute({
        sql: `INSERT INTO videoReviews (
          id, placeId, placeName, authorName, authorAvatar, userId,
          rating, videoUrl, thumbnailUrl, duration, likesCount,
          bookmarksCount, sharesCount, commentsCount, viewsCount, data, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          placeId = excluded.placeId,
          placeName = excluded.placeName,
          authorName = excluded.authorName,
          authorAvatar = excluded.authorAvatar,
          userId = excluded.userId,
          rating = excluded.rating,
          videoUrl = excluded.videoUrl,
          thumbnailUrl = excluded.thumbnailUrl,
          likesCount = excluded.likesCount,
          bookmarksCount = excluded.bookmarksCount,
          sharesCount = excluded.sharesCount,
          commentsCount = excluded.commentsCount,
          viewsCount = excluded.viewsCount,
          data = excluded.data,
          updatedAt = CURRENT_TIMESTAMP`,
        args: [
          reviewRecord.id,
          reviewRecord.placeId,
          reviewRecord.placeName,
          reviewRecord.authorName,
          reviewRecord.authorAvatar,
          reviewRecord.userId || "",
          reviewRecord.rating,
          "",
          reviewRecord.thumbnailUrl,
          reviewRecord.likes || 0,
          reviewRecord.bookmarksCount || 0,
          reviewRecord.sharesCount || 0,
          reviewRecord.commentsCount || 0,
          reviewRecord.viewsCount || 0,
          JSON.stringify(reviewRecord),
        ],
      });
    } catch (revDbErr) {
      console.error(`[Seeder] Error inserting review ${reviewRecord.id}:`, revDbErr);
    }
  }

  // 6. Update JSON index files (reviews_index.json & users_index.json)
  try {
    const reviewsIndexPath = path.join(uploadsDir, "reviews_index.json");
    const publicReviewsIndexPath = path.join(rootDir, "public", "reviews_index.json");
    let existingReviews: VideoReview[] = [];

    if (fs.existsSync(reviewsIndexPath)) {
      try {
        existingReviews = JSON.parse(fs.readFileSync(reviewsIndexPath, "utf-8"));
      } catch (e) {}
    }

    // Merge: retain any other reviews not in our seed list, prepend seeded reviews
    const seedIds = new Set(reviewsToSave.map((r) => r.id));
    const nonSeedReviews = existingReviews.filter((r) => !seedIds.has(r.id) && r.id !== "rev-1794849576888-eavyc");
    const mergedReviews = [...reviewsToSave, ...nonSeedReviews];

    fs.writeFileSync(reviewsIndexPath, JSON.stringify(mergedReviews, null, 2), "utf-8");
    fs.writeFileSync(publicReviewsIndexPath, JSON.stringify(mergedReviews, null, 2), "utf-8");
  } catch (e) {
    console.error("[Seeder] Error updating reviews_index.json:", e);
  }

  try {
    const usersIndexPath = path.join(uploadsDir, "users_index.json");
    const publicUsersIndexPath = path.join(rootDir, "public", "users_index.json");
    let existingUsers: UserProfile[] = [];

    if (fs.existsSync(usersIndexPath)) {
      try {
        existingUsers = JSON.parse(fs.readFileSync(usersIndexPath, "utf-8"));
      } catch (e) {}
    }

    const seedUserIds = new Set(usersToSave.map((u) => u.id));
    const otherUsers = existingUsers.filter((u) => !seedUserIds.has(u.id));
    const mergedUsers = [...usersToSave, ...otherUsers];

    fs.writeFileSync(usersIndexPath, JSON.stringify(mergedUsers, null, 2), "utf-8");
    fs.writeFileSync(publicUsersIndexPath, JSON.stringify(mergedUsers, null, 2), "utf-8");
  } catch (e) {
    console.error("[Seeder] Error updating users_index.json:", e);
  }

  console.log(`[Seeder] Successfully seeded ${usersToSave.length} users and ${reviewsToSave.length} photo reviews!`);
  return {
    usersCount: usersToSave.length,
    reviewsCount: reviewsToSave.length,
    message: `Successfully seeded ${usersToSave.length} authentic community accounts and ${reviewsToSave.length} matched photo reviews.`,
  };
}
