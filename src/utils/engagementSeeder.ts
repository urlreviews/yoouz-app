import fs from "fs";
import path from "path";
import { getBunnyDb } from "../lib/bunny-db";

interface CommentBlueprint {
  authorUserId: string; // community user id OR "__REVIEW_AUTHOR__"
  text: string;
  likesCount?: number;
  replyToPrev?: boolean; // replies to the immediately preceding top-level comment on the same review
  hoursAfterReview?: number;
  likedByCreator?: boolean;
}

interface ReviewEngagementSpec {
  likes: number;
  bookmarks: number;
  shares: number;
  comments: CommentBlueprint[];
}

// Realistic, staggered ages (in hours before now) for all 40 seeded photo reviews
export const REVIEW_AGE_HOURS: Record<string, number> = {
  "rev_sephora_cosmetics_15": 9,      // 9h ago
  "rev_lerner_21": 14,                // 14h ago
  "rev_makicafe_32": 17,              // 17h ago
  "rev_wolt_delivery_11": 19,         // 19h ago
  "rev_flipper_40": 21,               // 21h ago
  "rev_healis_25": 23,                // 23h ago
  "rev_dunkin_coffee_02": 29,         // Yesterday
  "rev_soluxecleaning_38": 33,        // Yesterday
  "rev_jollibee_food_04": 38,         // Yesterday
  "rev_hotel_julien_27": 43,          // Yesterday
  "rev_apple_tech_03": 54,            // 2 days ago
  "rev_noma_34": 60,                  // 2 days ago
  "rev_propercoffee_bakery_13": 66,   // 2 days ago
  "rev_zara_apparel_01": 78,          // 3 days ago
  "rev_regalia_30": 84,               // 3 days ago
  "rev_art_coffee_06": 90,            // 3 days ago
  "rev_mcdonalds_meal_10": 102,       // 4 days ago
  "rev_celler_35": 108,               // 4 days ago
  "rev_praktijk_26": 114,             // 4 days ago
  "rev_dominos_pizza_07": 126,        // 5 days ago
  "rev_pintoart_18": 132,             // 5 days ago
  "rev_benchdepot_37": 138,           // 5 days ago
  "rev_hilton_hotel_08": 150,         // 6 days ago
  "rev_hoteldesgaleries_28": 156,     // 6 days ago
  "rev_refalo_22": 162,               // 6 days ago
  "rev_uniqlo_clothing_05": 180,      // 1 week ago
  "rev_fourseasons_12": 192,          // 1 week ago
  "rev_easyhotel_29": 204,            // 1 week ago
  "rev_calvin_klein_09": 216,         // 1 week ago
  "rev_bclaw_24": 228,                // 1 week ago
  "rev_multipharma_14": 240,          // 1 week ago
  "rev_guardslip_33": 252,            // 1 week ago
  "rev_seveneleven_16": 264,          // 1 week ago
  "rev_brightbeautiful_39": 276,      // 1 week ago
  "rev_autowerkplaats_17": 290,       // 1 week ago
  "rev_villaggio_31": 304,            // 1 week ago
  "rev_havanna_19": 318,              // 1 week ago
  "rev_nevada_legal_23": 344,         // 2 weeks ago
  "rev_burgerking_meal_20": 356,      // 2 weeks ago
  "rev_batterymart_36": 370,          // 2 weeks ago
  "rev-1794849576888-eavyc": 110,     // 4 days ago
};

// Returns strictly decreasing comment ages (in hours ago), each guaranteed < reviewAgeHours
// and landing in distinct human-readable relative time buckets
function getDistinctCommentAgesHours(reviewAgeHours: number, count: number, seedHash: number): number[] {
  const jitter = seedHash % 2; // 0 or 1h variation
  if (reviewAgeHours === 19) {
    return [14, 8, 3].slice(0, count);
  }
  if (reviewAgeHours <= 12) {
    return [7, 4, 2].slice(0, count);
  }
  if (reviewAgeHours <= 18) {
    return [12, 7, 3].slice(0, count);
  }
  if (reviewAgeHours <= 24) {
    return [16, 10, 4].slice(0, count);
  }
  if (reviewAgeHours < 48) {
    // Review is "Yesterday" -> comments are distinct hours ago today
    return [19 - jitter, 11 - jitter, 4 - jitter].slice(0, count);
  }
  if (reviewAgeHours < 72) {
    // Review is "2 days ago" -> comments are "Yesterday", "15h ago", "5h ago"
    return [32 + jitter, 15 - jitter, 5 - jitter].slice(0, count);
  }
  if (reviewAgeHours < 96) {
    // Review is "3 days ago" -> comments are "2 days ago", "Yesterday", "10h ago"
    return [54 + jitter, 30 + jitter, 10 - jitter].slice(0, count);
  }
  if (reviewAgeHours < 120) {
    // Review is "4 days ago" -> comments are "3 days ago", "Yesterday", "12h ago"
    return [78 + jitter, 33 + jitter, 12 - jitter].slice(0, count);
  }
  if (reviewAgeHours < 144) {
    // Review is "5 days ago" -> comments are "4 days ago", "2 days ago", "16h ago"
    return [102 + jitter, 56 + jitter, 16 - jitter].slice(0, count);
  }
  if (reviewAgeHours < 168) {
    // Review is "6 days ago" -> comments are "4 days ago", "2 days ago", "Yesterday"
    return [106 + jitter, 58 + jitter, 31 + jitter].slice(0, count);
  }
  if (reviewAgeHours < 336) {
    // Review is "1 week ago" -> comments are "5 days ago", "3 days ago", "Yesterday"
    return [128 + jitter, 80 + jitter, 32 + jitter].slice(0, count);
  }
  // Review is "2 weeks ago" -> comments are "1 week ago", "4 days ago", "2 days ago"
  return [208 + jitter, 104 + jitter, 55 + jitter].slice(0, count);
}

// Tailored, natural, to-the-point human engagement plan for all current photo reviews
const ENGAGEMENT_PLAN: Record<string, ReviewEngagementSpec> = {
  "rev-1794849576888-eavyc": {
    likes: 11,
    bookmarks: 2,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_29", text: "double whopper always hits when its fresh", likesCount: 2, hoursAfterReview: 4 },
      { authorUserId: "usr_liam_oconnor", text: "fries actually look crispy here", likesCount: 1, hoursAfterReview: 9 },
    ],
  },
  "rev_zara_apparel_01": {
    likes: 15,
    bookmarks: 5,
    shares: 4,
    comments: [
      { authorUserId: "usr_comm_31", text: "need the item code for this coat please", likesCount: 3, hoursAfterReview: 3 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "ill check the tag when im home!", likesCount: 2, replyToPrev: true, hoursAfterReview: 5, likedByCreator: true },
      { authorUserId: "usr_comm_28", text: "looks way more expensive than zara", likesCount: 1, hoursAfterReview: 14 },
    ],
  },
  "rev_dunkin_coffee_02": {
    likes: 9,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_35", text: "oat milk caramel swirl is underrated", likesCount: 2, hoursAfterReview: 2 },
      { authorUserId: "usr_comm_21", text: "glazed donut looks super fresh", likesCount: 0, hoursAfterReview: 7 },
    ],
  },
  "rev_apple_tech_03": {
    likes: 14,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_comm_38", text: "clean setup, midnight finish?", likesCount: 2, hoursAfterReview: 5 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "yep midnight m3", likesCount: 1, replyToPrev: true, hoursAfterReview: 6 },
    ],
  },
  "rev_jollibee_food_04": {
    likes: 13,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_david_chen", text: "extra gravy cup is mandatory", likesCount: 4, hoursAfterReview: 3 },
      { authorUserId: "usr_comm_40", text: "spicy chickenjoy never misses", likesCount: 1, hoursAfterReview: 11 },
    ],
  },
  "rev_uniqlo_clothing_05": {
    likes: 7,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_34", text: "supima tees last me years tbh", likesCount: 2, hoursAfterReview: 6 },
      { authorUserId: "usr_comm_25", text: "great colors, are they true to size?", likesCount: 0, hoursAfterReview: 12 },
    ],
  },
  "rev_art_coffee_06": {
    likes: 8,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_35", text: "microfoam on that flat white looks spot on", likesCount: 2, hoursAfterReview: 4 },
      { authorUserId: "usr_comm_33", text: "such a cozy spot to read", likesCount: 1, hoursAfterReview: 10 },
    ],
  },
  "rev_dominos_pizza_07": {
    likes: 10,
    bookmarks: 2,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_27", text: "garlic crust + pepperoni is elite", likesCount: 3, hoursAfterReview: 3 },
      { authorUserId: "usr_comm_22", text: "did it come hot?", likesCount: 0, hoursAfterReview: 8 },
    ],
  },
  "rev_hilton_hotel_08": {
    likes: 11,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_comm_36", text: "that window light is gorgeous", likesCount: 2, hoursAfterReview: 5 },
      { authorUserId: "usr_comm_30", text: "which floor was this?", likesCount: 0, hoursAfterReview: 13 },
    ],
  },
  "rev_calvin_klein_09": {
    likes: 6,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_alex_carter", text: "solid everyday jacket", likesCount: 1, hoursAfterReview: 6 },
      { authorUserId: "usr_comm_24", text: "fit looks super clean", likesCount: 0, hoursAfterReview: 16 },
    ],
  },
  "rev_mcdonalds_meal_10": {
    likes: 16,
    bookmarks: 3,
    shares: 4,
    comments: [
      { authorUserId: "usr_comm_29", text: "mcdonalds fries straight out the fryer cant be beat", likesCount: 5, hoursAfterReview: 2 },
      { authorUserId: "usr_comm_26", text: "classic combo", likesCount: 1, hoursAfterReview: 9 },
    ],
  },
  "rev_wolt_delivery_11": {
    likes: 9,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_37", text: "22 mins is impressive for ramen", likesCount: 2, hoursAfterReview: 5 },
      { authorUserId: "usr_aiko_tanaka", text: "broth didnt spill at all?", likesCount: 1, hoursAfterReview: 11 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "sealed lid held up great", likesCount: 2, replyToPrev: true, hoursAfterReview: 16 },
    ],
  },
  "rev_fourseasons_12": {
    likes: 12,
    bookmarks: 5,
    shares: 3,
    comments: [
      { authorUserId: "usr_olivia_bennett", text: "love how quiet that garden lounge is", likesCount: 2, hoursAfterReview: 6 },
    ],
  },
  "rev_propercoffee_bakery_13": {
    likes: 8,
    bookmarks: 4,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_39", text: "good ceremonial matcha is hard to find around here", likesCount: 2, hoursAfterReview: 4 },
      { authorUserId: "usr_maya_lin", text: "bookmarking this for saturday morning", likesCount: 1, hoursAfterReview: 11 },
    ],
  },
  "rev_multipharma_14": {
    likes: 4,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_33", text: "been looking for a gentle barrier serum, gonna pick this up", likesCount: 1, hoursAfterReview: 7 },
    ],
  },
  "rev_sephora_cosmetics_15": {
    likes: 14,
    bookmarks: 5,
    shares: 4,
    comments: [
      { authorUserId: "usr_elena_rostova", text: "does the matte lipstick dry out your lips?", likesCount: 2, hoursAfterReview: 2 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "not at all with a light balm underneath", likesCount: 3, replyToPrev: true, hoursAfterReview: 5 },
      { authorUserId: "usr_comm_28", text: "that shade is so pretty", likesCount: 1, hoursAfterReview: 7 },
    ],
  },
  "rev_seveneleven_16": {
    likes: 5,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_32", text: "best 3 dollar road trip breakfast", likesCount: 2, hoursAfterReview: 5 },
    ],
  },
  "rev_autowerkplaats_17": {
    likes: 4,
    bookmarks: 2,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_34", text: "hard finding an honest garage these days", likesCount: 2, hoursAfterReview: 6 },
      { authorUserId: "usr_comm_23", text: "how was the wait time?", likesCount: 0, hoursAfterReview: 12 },
    ],
  },
  "rev_pintoart_18": {
    likes: 13,
    bookmarks: 5,
    shares: 4,
    comments: [
      { authorUserId: "usr_comm_36", text: "on my bucket list when i visit manila", likesCount: 3, hoursAfterReview: 4 },
      { authorUserId: "usr_isabella_gomez", text: "best light is around 4pm there", likesCount: 2, hoursAfterReview: 10 },
    ],
  },
  "rev_havanna_19": {
    likes: 7,
    bookmarks: 2,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_40", text: "those dark chocolate alfajores are dangerously good", likesCount: 2, hoursAfterReview: 5 },
    ],
  },
  "rev_burgerking_meal_20": {
    likes: 6,
    bookmarks: 1,
    shares: 2,
    comments: [
      { authorUserId: "usr_dries_vandamme", text: "onion rings or fries tho", likesCount: 1, hoursAfterReview: 4 },
      { authorUserId: "usr_marcus_sterling", text: "looks freshly grilled", likesCount: 0, hoursAfterReview: 9 },
    ],
  },
  "rev_lerner_21": {
    likes: 4,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_31", text: "glad they actually listened, makes a huge difference", likesCount: 1, hoursAfterReview: 5 },
    ],
  },
  "rev_refalo_22": {
    likes: 4,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_32", text: "clear checklists save so much headache", likesCount: 1, hoursAfterReview: 4 },
      { authorUserId: "usr_comm_27", text: "how long did the whole filing take?", likesCount: 0, hoursAfterReview: 11 },
    ],
  },
  "rev_nevada_legal_23": {
    likes: 3,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_30", text: "good to know they have walk-in mornings", likesCount: 1, hoursAfterReview: 6 },
    ],
  },
  "rev_bclaw_24": {
    likes: 5,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_olivia_bennett", text: "plain english legal advice is rare", likesCount: 2, hoursAfterReview: 5 },
    ],
  },
  "rev_healis_25": {
    likes: 6,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_33", text: "checked interactions too? thats proper care", likesCount: 2, hoursAfterReview: 3 },
      { authorUserId: "usr_gabriel_moreau", text: "my go-to pharmacy in town", likesCount: 1, hoursAfterReview: 8 },
    ],
  },
  "rev_praktijk_26": {
    likes: 7,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_27", text: "booking a session next week for my shoulder", likesCount: 1, hoursAfterReview: 6 },
    ],
  },
  "rev_hotel_julien_27": {
    likes: 9,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_zoe_almansoor", text: "that ivy courtyard looks so peaceful", likesCount: 2, hoursAfterReview: 3 },
      { authorUserId: "usr_sofia_rossi", text: "did you stay there or just stop for coffee?", likesCount: 1, hoursAfterReview: 7 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "stayed two nights, spa downstairs is worth it too", likesCount: 2, replyToPrev: true, hoursAfterReview: 9 },
    ],
  },
  "rev_hoteldesgaleries_28": {
    likes: 5,
    bookmarks: 2,
    shares: 2,
    comments: [
      { authorUserId: "usr_elena_rostova", text: "love those tall brussels windows", likesCount: 1, hoursAfterReview: 4 },
      { authorUserId: "usr_kenji_sato", text: "is street noise loud at night?", likesCount: 0, hoursAfterReview: 10 },
    ],
  },
  "rev_easyhotel_29": {
    likes: 4,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_29", text: "tiny rooms tbh but unbeatable location for a quick overnight", likesCount: 2, hoursAfterReview: 4 },
      { authorUserId: "usr_alex_carter", text: "yeah fair 3 stars if you just need a clean bed", likesCount: 1, replyToPrev: true, hoursAfterReview: 7 },
    ],
  },
  "rev_regalia_30": {
    likes: 10,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_lucas_silva", text: "that infinity pool skyline view never gets old", likesCount: 3, hoursAfterReview: 3 },
      { authorUserId: "usr_maya_lin", text: "crowd gets packed at sunset?", likesCount: 1, hoursAfterReview: 8 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "a bit around 6pm, morning swim is super chill", likesCount: 2, replyToPrev: true, hoursAfterReview: 10 },
    ],
  },
  "rev_villaggio_31": {
    likes: 4,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_zoe_almansoor", text: "pool area looks super relaxing", likesCount: 1, hoursAfterReview: 5 },
    ],
  },
  "rev_makicafe_32": {
    likes: 8,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_comm_37", text: "that egg in the ramen looks perfect", likesCount: 2, hoursAfterReview: 3 },
      { authorUserId: "usr_david_chen", text: "saving this spot for lunch tomorrow", likesCount: 1, hoursAfterReview: 9 },
    ],
  },
  "rev_guardslip_33": {
    likes: 3,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_35", text: "not overly sweet iced latte is rare, nice", likesCount: 1, hoursAfterReview: 5 },
    ],
  },
  "rev_noma_34": {
    likes: 15,
    bookmarks: 5,
    shares: 4,
    comments: [
      { authorUserId: "usr_comm_40", text: "jealous, impossible to snag a reservation", likesCount: 4, hoursAfterReview: 2 },
      { authorUserId: "usr_aiko_tanaka", text: "plating looks like art", likesCount: 2, hoursAfterReview: 6 },
    ],
  },
  "rev_celler_35": {
    likes: 12,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_comm_37", text: "their dessert course is unreal", likesCount: 2, hoursAfterReview: 4 },
      { authorUserId: "usr_isabella_gomez", text: "once in a lifetime meal", likesCount: 1, hoursAfterReview: 9 },
    ],
  },
  "rev_batterymart_36": {
    likes: 2,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_dries_vandamme", text: "agm batteries hold up way better in winter", likesCount: 1, hoursAfterReview: 6 },
    ],
  },
  "rev_benchdepot_37": {
    likes: 5,
    bookmarks: 2,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_38", text: "solid maple top looks heavy duty", likesCount: 1, hoursAfterReview: 4 },
      { authorUserId: "usr_marcus_sterling", text: "zero wobble is huge for soldering", likesCount: 1, hoursAfterReview: 10 },
    ],
  },
  "rev_soluxecleaning_38": {
    likes: 6,
    bookmarks: 3,
    shares: 2,
    comments: [
      { authorUserId: "usr_olivia_bennett", text: "did they bring all their own supplies?", likesCount: 1, hoursAfterReview: 3 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "yes everything included, even oven cleaner", likesCount: 2, replyToPrev: true, hoursAfterReview: 5 },
    ],
  },
  "rev_brightbeautiful_39": {
    likes: 4,
    bookmarks: 1,
    shares: 1,
    comments: [
      { authorUserId: "usr_comm_28", text: "coming home to a clean house hits different", likesCount: 1, hoursAfterReview: 5 },
    ],
  },
  "rev_flipper_40": {
    likes: 11,
    bookmarks: 4,
    shares: 3,
    comments: [
      { authorUserId: "usr_comm_32", text: "what firmware are you running on it?", likesCount: 2, hoursAfterReview: 2 },
      { authorUserId: "__REVIEW_AUTHOR__", text: "stock + unleashed testing, lasts days", likesCount: 2, replyToPrev: true, hoursAfterReview: 3 },
      { authorUserId: "usr_comm_34", text: "battery life on these things is crazy good", likesCount: 1, hoursAfterReview: 7 },
    ],
  },
};

const SHARE_PLATFORMS = ["whatsapp", "copy_link", "facebook", "instagram", "twitter", "general"] as const;

function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toSqliteTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").substring(0, 19);
}

export async function seedCommunityEngagementV1(): Promise<{
  likesAdded: number;
  bookmarksAdded: number;
  sharesAdded: number;
  commentsAdded: number;
  allComments: any[];
  updatedReviewsCount: number;
}> {
  const db = getBunnyDb();
  if (!db) {
    throw new Error("BunnyDB database client unavailable");
  }

  // 1. Load our 40 community accounts (usr_*) strictly using synthetic community emails
  const usersRes = await db.execute("SELECT id, email, name, avatar, data FROM users WHERE id LIKE 'usr_%' ORDER BY id");
  const communityUsers = (usersRes.rows || [])
    .map((row: any) => {
      let d: any = {};
      try { d = typeof row.data === "string" ? JSON.parse(row.data) : (row.data || {}); } catch {}
      const id = String(row.id || "");
      const email = String(row.email || d.email || "").trim().toLowerCase();
      const name = String(row.name || d.name || d.username || "Community Member").trim();
      const handle = String(
        d.handle ||
          (/^U\/[A-Z0-9]{4,}$/i.test(name)
            ? `@${name.replace(/^U\//i, "u_").toLowerCase()}`
            : `@${name.toLowerCase().replace(/[^a-z0-9]/g, "")}`)
      );
      const avatar = String(row.avatar || d.avatar || "");
      return { id, email, name, handle: handle.startsWith("@") ? handle : `@${handle}`, avatar };
    })
    .filter((u) => u.id && u.email && !u.email.includes("4samet"));

  const userById = new Map(communityUsers.map((u) => [u.id, u]));

  // 2. Load all current videoReviews
  const reviewsRes = await db.execute("SELECT id, placeId, placeName, authorName, authorAvatar, userId, rating, thumbnailUrl, data, createdAt FROM videoReviews ORDER BY id");
  const reviewRows = reviewsRes.rows || [];

  const now = Date.now();
  let likesAdded = 0;
  let bookmarksAdded = 0;
  let sharesAdded = 0;
  let commentsAdded = 0;
  let updatedReviewsCount = 0;

  for (let rIdx = 0; rIdx < reviewRows.length; rIdx++) {
    const row: any = reviewRows[rIdx];
    const videoId = String(row.id || "");
    if (!videoId) continue;

    let revData: any = {};
    try { revData = typeof row.data === "string" ? JSON.parse(row.data) : (row.data || {}); } catch {}

    const placeId = String(row.placeId || revData.placeId || "");
    const placeName = String(row.placeName || revData.placeName || "Place");
    const placeCategory = String(revData.placeCategory || "");
    const placeLogo = String(revData.placeLogoUrl || revData.logoUrl || "");
    const videoThumbnail = String(revData.photoUrl || revData.thumbnailUrl || row.thumbnailUrl || "");
    const videoAuthor = String(row.authorName || revData.authorName || revData.author?.name || "Reviewer");
    const reviewAuthorId = String(row.userId || revData.userId || revData.author?.id || "");
    const reviewAuthorAvatar = String(row.authorAvatar || revData.authorAvatar || revData.author?.avatar || "");
    const reviewAuthorHandle = String(revData.author?.handle || `@${videoAuthor.toLowerCase().replace(/[^a-z0-9]/g, "")}`);
    const videoRating = Number(row.rating || revData.rating || 5);

    const seedHash = hashStr(videoId);
    const isSeededReview = Object.prototype.hasOwnProperty.call(REVIEW_AGE_HOURS, videoId);
    const reviewAgeHours = isSeededReview
      ? REVIEW_AGE_HOURS[videoId]
      : Math.max(1, Math.round((now - (Number(revData.createdAtMs) || Date.parse(String(row.createdAt || revData.createdAt || "")) || now)) / 3600_000));

    const baseMs = isSeededReview
      ? now - reviewAgeHours * 3600_000 - ((seedHash % 24) * 60_000)
      : (Number(revData.createdAtMs) || Date.parse(String(row.createdAt || revData.createdAt || "")) || now);
    const isoRevAt = new Date(baseMs).toISOString();
    const sqlRevAt = toSqliteTimestamp(baseMs);

    const plan: ReviewEngagementSpec | undefined = ENGAGEMENT_PLAN[videoId];

    // Eligible pool of community users excluding review author
    const eligibleActors = communityUsers.filter((u) => u.id !== reviewAuthorId);
    const actorCount = eligibleActors.length;
    if (actorCount === 0) continue;

    if (plan) {
      // 2a. Seed Likes (all strictly between review creation time and now)
      const targetLikes = Math.min(plan.likes, actorCount);
      for (let i = 0; i < targetLikes; i++) {
        const actor = eligibleActors[(seedHash + i * 7) % actorCount];
        const likeId = `like_${actor.id}_${videoId}`;
        const spanMs = Math.max(1800_000, now - baseMs - 600_000);
        const safeTsMs = Math.min(
          now - 300_000 - i * 60_000,
          baseMs + Math.round(((i + 1) / (targetLikes + 1)) * spanMs)
        );
        const isoAt = new Date(safeTsMs).toISOString();
        const sqlAt = toSqliteTimestamp(safeTsMs);

        const likeData = {
          id: likeId,
          videoId,
          userId: actor.id,
          userEmail: actor.email,
          userName: actor.name,
          authorName: actor.name,
          userAvatar: actor.avatar,
          authorAvatar: actor.avatar,
          userHandle: actor.handle,
          authorHandle: actor.handle,
          placeId,
          placeName,
          videoThumbnail,
          videoUrl: "",
          videoAuthor,
          videoRating,
          isLiked: true,
          createdAt: isoAt,
          createdAtMs: safeTsMs,
        };

        await db.execute({
          sql: `INSERT OR REPLACE INTO likes (id, userId, userEmail, videoId, data, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [likeId, actor.id, actor.email, videoId, JSON.stringify(likeData), sqlAt, sqlAt],
        });
        likesAdded++;
      }

      // 2b. Seed Bookmarks / Saves
      const targetBookmarks = Math.min(plan.bookmarks, actorCount);
      for (let i = 0; i < targetBookmarks; i++) {
        const actor = eligibleActors[(seedHash + 13 + i * 11) % actorCount];
        const safeSlug = videoId.replace(/[^a-z0-9]/gi, "_");
        const bmId = `bm_${actor.id}_${safeSlug}`;
        const spanMs = Math.max(1800_000, now - baseMs - 900_000);
        const safeTsMs = Math.min(
          now - 450_000 - i * 90_000,
          baseMs + Math.round(((i + 1) / (targetBookmarks + 1)) * spanMs)
        );
        const isoAt = new Date(safeTsMs).toISOString();
        const sqlAt = toSqliteTimestamp(safeTsMs);

        const bmData = {
          id: bmId,
          videoId,
          placeId,
          placeName,
          placeCategory,
          placeLogo,
          userId: actor.id,
          userEmail: actor.email,
          userName: actor.name,
          authorName: actor.name,
          userAvatar: actor.avatar,
          authorAvatar: actor.avatar,
          userHandle: actor.handle,
          authorHandle: actor.handle,
          videoThumbnail,
          videoAuthor,
          videoRating,
          videoUrl: "",
          isBookmarked: true,
          createdAt: isoAt,
          createdAtMs: safeTsMs,
        };

        await db.execute({
          sql: `INSERT OR REPLACE INTO bookmarks (id, userId, userEmail, placeId, videoId, data, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [bmId, actor.id, actor.email, placeId, videoId, JSON.stringify(bmData), sqlAt, sqlAt],
        });
        bookmarksAdded++;
      }

      // 2c. Seed Shares
      const targetShares = Math.min(plan.shares, actorCount);
      for (let i = 0; i < targetShares; i++) {
        const actor = eligibleActors[(seedHash + 19 + i * 5) % actorCount];
        const platform = SHARE_PLATFORMS[(seedHash + i) % SHARE_PLATFORMS.length];
        const shareId = `share_seed_${actor.id}_${videoId}_${i}`;
        const spanMs = Math.max(1800_000, now - baseMs - 1200_000);
        const safeTsMs = Math.min(
          now - 600_000 - i * 120_000,
          baseMs + Math.round(((i + 1) / (targetShares + 1)) * spanMs)
        );
        const isoAt = new Date(safeTsMs).toISOString();
        const sqlAt = toSqliteTimestamp(safeTsMs);

        const shareData = {
          id: shareId,
          videoId,
          userId: actor.id,
          userEmail: actor.email,
          userName: actor.name,
          authorName: actor.name,
          userAvatar: actor.avatar,
          authorAvatar: actor.avatar,
          userHandle: actor.handle,
          authorHandle: actor.handle,
          placeName,
          videoThumbnail,
          videoAuthor,
          platform,
          timestamp: safeTsMs,
          createdAt: isoAt,
          createdAtMs: safeTsMs,
        };

        await db.execute({
          sql: `INSERT OR REPLACE INTO shares (id, userId, videoId, platform, data, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [shareId, actor.id, videoId, platform, JSON.stringify(shareData), sqlAt, sqlAt],
        });
        sharesAdded++;
      }

      // 2d. Seed Natural Comments & Replies with realistic, distinct relative timestamps newer than the review
      const distinctCommentAges = getDistinctCommentAgesHours(reviewAgeHours, plan.comments.length, seedHash);
      let lastTopLevelCommentId: string | undefined = undefined;
      for (let i = 0; i < plan.comments.length; i++) {
        const cb = plan.comments[i];
        const isAuthorReply = cb.authorUserId === "__REVIEW_AUTHOR__";
        const matchedActor = !isAuthorReply ? (userById.get(cb.authorUserId) || eligibleActors[i % actorCount]) : null;

        const actorId = isAuthorReply ? reviewAuthorId : matchedActor!.id;
        const actorName = isAuthorReply ? videoAuthor : matchedActor!.name;
        const actorHandle = isAuthorReply ? reviewAuthorHandle : matchedActor!.handle;
        const actorAvatar = isAuthorReply ? reviewAuthorAvatar : matchedActor!.avatar;

        const commentAgeHours = distinctCommentAges[i] ?? Math.max(1, Math.floor(reviewAgeHours / (i + 2)));
        const commentMinuteOffset = ((seedHash + i * 13) % 19) * 60_000;
        const rawCommentMs = now - commentAgeHours * 3600_000 - commentMinuteOffset;
        // Guarantee strictly newer than review and strictly before now
        const finalTsMs = Math.max(baseMs + (i + 1) * 900_000, Math.min(rawCommentMs, now - 120_000));
        const isoAt = new Date(finalTsMs).toISOString();
        const sqlAt = toSqliteTimestamp(finalTsMs);

        const commentId = `comm_seed_${videoId.replace(/[^a-z0-9]/gi, "_")}_${i}`;
        const isReply = Boolean(cb.replyToPrev && lastTopLevelCommentId);
        const parentId = isReply ? lastTopLevelCommentId : undefined;
        if (!isReply) lastTopLevelCommentId = commentId;

        const commentObj: any = {
          id: commentId,
          videoId,
          userId: actorId,
          authorId: actorId,
          authorName: actorName,
          authorHandle: actorHandle,
          authorAvatar: actorAvatar,
          text: cb.text,
          createdAt: isoAt,
          createdAtMs: finalTsMs,
          likesCount: cb.likesCount ?? 0,
          likedByCreator: Boolean(cb.likedByCreator),
          isCreator: isAuthorReply,
          isVerified: true,
          attachments: [],
          replies: [],
          ...(isReply && parentId ? { replyToId: parentId, parentId, isReply: true } : {}),
        };

        await db.execute({
          sql: `INSERT OR REPLACE INTO comments (id, videoId, userId, userName, userAvatar, text, data, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [commentId, videoId, actorId, actorName, actorAvatar, cb.text, JSON.stringify(commentObj), sqlAt, sqlAt],
        });
        commentsAdded++;
      }
    }

    // Remove any legacy non-deterministic timestamped seed comments for this videoId
    await db.execute({
      sql: `DELETE FROM comments WHERE videoId = ? AND id LIKE 'comm_179%'`,
      args: [videoId],
    });

    // 3. Recompute exact totals from BunnyDB tables for this videoId and sync videoReviews
    const [lkC, bmC, shC, cmRes] = await Promise.all([
      db.execute({ sql: "SELECT COUNT(*) as total FROM likes WHERE videoId = ?", args: [videoId] }),
      db.execute({ sql: "SELECT COUNT(*) as total FROM bookmarks WHERE videoId = ?", args: [videoId] }),
      db.execute({ sql: "SELECT COUNT(*) as total FROM shares WHERE videoId = ?", args: [videoId] }),
      db.execute({ sql: "SELECT id, videoId, userId, userName, userAvatar, text, data, createdAt FROM comments WHERE videoId = ? ORDER BY createdAt ASC", args: [videoId] }),
    ]);

    const realLikes = Number((lkC.rows?.[0] as any)?.total || 0);
    const realBookmarks = Number((bmC.rows?.[0] as any)?.total || 0);
    const realShares = Number((shC.rows?.[0] as any)?.total || 0);
    const videoComments = (cmRes.rows || []).map((cr: any) => {
      let cd: any = {};
      try { cd = typeof cr.data === "string" ? JSON.parse(cr.data) : (cr.data || {}); } catch {}
      return {
        ...cd,
        id: String(cr.id),
        videoId: String(cr.videoId),
        userId: cr.userId || cd.userId || "",
        authorName: cr.userName || cd.authorName || "Member",
        authorAvatar: cr.userAvatar || cd.authorAvatar || "",
        text: cr.text || cd.text || "",
        createdAt: cd.createdAt || cr.createdAt,
        createdAtMs: typeof cd.createdAtMs === "number" ? cd.createdAtMs : undefined,
      };
    });

    // Build top-level + nested replies cleanly for embedded videoReviews.data.comments
    const topComments = videoComments.filter((c: any) => !c.replyToId).map((c: any) => ({ ...c, replies: [] as any[] }));
    for (const c of videoComments) {
      if (c.replyToId) {
        const parent = topComments.find((p: any) => p.id === c.replyToId);
        if (parent) parent.replies.push(c);
        else topComments.push(c);
      }
    }

    const { photoDataUrl: _omitPhotoDataUrl, ...cleanRevData } = revData;
    const updatedData = {
      ...cleanRevData,
      createdAt: isoRevAt,
      createdAtMs: baseMs,
      recordedAt: isoRevAt,
      likes: realLikes,
      likesCount: realLikes,
      bookmarks: realBookmarks,
      bookmarksCount: realBookmarks,
      shares: realShares,
      sharesCount: realShares,
      commentsCount: videoComments.length,
      comments: topComments,
    };

    await db.execute({
      sql: `UPDATE videoReviews SET likesCount = ?, bookmarksCount = ?, sharesCount = ?, commentsCount = ?, data = ?, createdAt = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [realLikes, realBookmarks, realShares, videoComments.length, JSON.stringify(updatedData), sqlRevAt, videoId],
    });
    updatedReviewsCount++;
  }

  // Clean up any orphaned likes/bookmarks/shares/comments referencing deleted/non-existent videoIds
  await Promise.all([
    db.execute("DELETE FROM likes WHERE videoId NOT IN (SELECT id FROM videoReviews)"),
    db.execute("DELETE FROM bookmarks WHERE videoId IS NOT NULL AND videoId != '' AND videoId NOT IN (SELECT id FROM videoReviews)"),
    db.execute("DELETE FROM shares WHERE videoId NOT IN (SELECT id FROM videoReviews)"),
    db.execute("DELETE FROM comments WHERE videoId NOT IN (SELECT id FROM videoReviews)"),
  ]);

  // 4. Write all comments to uploads/comments_index.json and public/comments_index.json cleanly
  const allDbCommentsRes = await db.execute("SELECT id, videoId, userId, userName, userAvatar, text, data, createdAt FROM comments ORDER BY createdAt DESC");
  const allComments = (allDbCommentsRes.rows || []).map((cr: any) => {
    let cd: any = {};
    try { cd = typeof cr.data === "string" ? JSON.parse(cr.data) : (cr.data || {}); } catch {}
    return {
      ...cd,
      id: String(cr.id),
      videoId: String(cr.videoId),
      userId: cr.userId || cd.userId || "",
      authorName: cr.userName || cd.authorName || "Member",
      authorAvatar: cr.userAvatar || cd.authorAvatar || "",
      text: cr.text || cd.text || "",
      createdAt: cd.createdAt || cr.createdAt,
      createdAtMs: typeof cd.createdAtMs === "number" ? cd.createdAtMs : undefined,
    };
  });

  try {
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    fs.writeFileSync(path.join(uploadsDir, "comments_index.json"), JSON.stringify(allComments, null, 2), "utf8");
    const publicDir = path.join(process.cwd(), "public");
    if (fs.existsSync(publicDir)) {
      fs.writeFileSync(path.join(publicDir, "comments_index.json"), JSON.stringify(allComments, null, 2), "utf8");
    }
  } catch {}

  return {
    likesAdded,
    bookmarksAdded,
    sharesAdded,
    commentsAdded,
    allComments,
    updatedReviewsCount,
  };
}
