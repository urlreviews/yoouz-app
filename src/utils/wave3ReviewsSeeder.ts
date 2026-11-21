import fs from "fs";
import path from "path";
import { getBunnyDb } from "../lib/bunny-db";
import { VideoReview } from "../types";
import { classifyBusinessCategory } from "./categoryUtils";

interface Wave3ReviewDef {
  reviewId: string;
  reviewerId: string;
  placeId: string;
  placeName: string;
  category: string;
  rating: number;
  photoFilename: string;
  dishOrItem: string;
  caption: string;
  likesCount: number;
  bookmarksCount: number;
  sharesCount: number;
  viewsCount: number;
  hoursAgo: number;
}

/**
 * 15 candid smartphone photo reviews authored strictly by 10 EXISTING community users
 * (zero new users created). Covers existing DB businesses with realistic 2★–5★ variety.
 */
export const WAVE3_MULTI_REVIEWS: Wave3ReviewDef[] = [
  // 1-2. Aiko Tanaka (usr_aiko_tanaka) -> +2 reviews (total 3)
  {
    reviewId: "rev_w3_cetaphil_41",
    reviewerId: "usr_aiko_tanaka",
    placeId: "cetaphil.com",
    placeName: "Cetaphil",
    category: "Skincare & Beauty",
    rating: 4,
    photoFilename: "rev_w3_cetaphil_41_cetaphil_com.jpg",
    dishOrItem: "Gentle Skin Cleanser 16 oz",
    caption: "No fragrance and never leaves my skin tight after washing. Pump sticks a tiny bit near the bottom, still my reliable bathroom staple.",
    likesCount: 44,
    bookmarksCount: 19,
    sharesCount: 4,
    viewsCount: 412,
    hoursAgo: 11
  },
  {
    reviewId: "rev_w3_uniqlo_42",
    reviewerId: "usr_aiko_tanaka",
    placeId: "uniqlo.com",
    placeName: "Uniqlo US",
    category: "Apparel & Clothing",
    rating: 3,
    photoFilename: "rev_w3_uniqlo_42_uniqlo_com.jpg",
    dishOrItem: "Cotton Crew Tee & Linen Trousers",
    caption: "Decent everyday basics for the price, though the linen pants crease instantly right off the hanger and sizing runs a bit boxy.",
    likesCount: 29,
    bookmarksCount: 11,
    sharesCount: 2,
    viewsCount: 338,
    hoursAgo: 74
  },

  // 3-4. David C (usr_david_chen) -> +2 reviews (total 3)
  {
    reviewId: "rev_w3_doordash_43",
    reviewerId: "usr_david_chen",
    placeId: "doordash.com",
    placeName: "DoorDash",
    category: "Food & Delivery",
    rating: 2,
    photoFilename: "rev_w3_doordash_43_doordash_com.jpg",
    dishOrItem: "Late-Night Noodle Soup Delivery",
    caption: "Arrived 35 minutes past the estimate with the soup container tipped sideways inside the bag. Half the broth leaked straight onto the counter.",
    likesCount: 67,
    bookmarksCount: 15,
    sharesCount: 9,
    viewsCount: 684,
    hoursAgo: 16
  },
  {
    reviewId: "rev_w3_apple_44",
    reviewerId: "usr_david_chen",
    placeId: "apple.com",
    placeName: "Apple",
    category: "Consumer Electronics & Tech",
    rating: 4,
    photoFilename: "rev_w3_apple_44_apple_com.jpg",
    dishOrItem: "USB-C Cable & Laptop Pickup",
    caption: "Quick in-store pickup and the hardware works out of the box without fuss. Only docking a star for how pricey replacement cables still are.",
    likesCount: 38,
    bookmarksCount: 14,
    sharesCount: 3,
    viewsCount: 425,
    hoursAgo: 118
  },

  // 5-6. Sofia Rossi (usr_sofia_rossi) -> +2 reviews (total 3)
  {
    reviewId: "rev_w3_nike_45",
    reviewerId: "usr_sofia_rossi",
    placeId: "nike.com",
    placeName: "Nike",
    category: "Sportswear & Footwear",
    rating: 5,
    photoFilename: "rev_w3_nike_45_nike_com.jpg",
    dishOrItem: "Mesh Running Sneakers",
    caption: "True to size straight out of the box and super breathable on a 5K morning jog. Clean grey-white colorway goes with almost everything.",
    likesCount: 91,
    bookmarksCount: 42,
    sharesCount: 8,
    viewsCount: 790,
    hoursAgo: 7
  },
  {
    reviewId: "rev_w3_sephora_46",
    reviewerId: "usr_sofia_rossi",
    placeId: "sephora.com",
    placeName: "Sephora",
    category: "Beauty & Cosmetics",
    rating: 3,
    photoFilename: "rev_w3_sephora_46_sephora_com.jpg",
    dishOrItem: "Serum Restock Haul",
    caption: "Picked up my usual serum restock, but the mall branch was packed and two shades I came in for were sold out with messy tester shelves.",
    likesCount: 36,
    bookmarksCount: 16,
    sharesCount: 3,
    viewsCount: 465,
    hoursAgo: 96
  },

  // 7-8. Isabella Gomez (usr_isabella_gomez) -> +2 reviews (total 3)
  {
    reviewId: "rev_w3_dunkin_47",
    reviewerId: "usr_isabella_gomez",
    placeId: "dunkindonuts.com",
    placeName: "Dunkin' Donuts",
    category: "Coffee & Bakery",
    rating: 2,
    photoFilename: "rev_w3_dunkin_47_dunkindonuts_com.jpg",
    dishOrItem: "Iced Coffee & Glazed Donut",
    caption: "Iced coffee tasted mostly like watered-down milk today and the glaze on my donut stuck completely to the paper bag before I left the drive-thru.",
    likesCount: 53,
    bookmarksCount: 12,
    sharesCount: 6,
    viewsCount: 540,
    hoursAgo: 26
  },
  {
    reviewId: "rev_w3_dominos_48",
    reviewerId: "usr_isabella_gomez",
    placeId: "dominos.com",
    placeName: "Domino's Pizza",
    category: "Pizza & Fast Food",
    rating: 3,
    photoFilename: "rev_w3_dominos_48_dominos_com.jpg",
    dishOrItem: "Pepperoni Delivery Pizza",
    caption: "Hot enough and hits the spot on a lazy Friday night, though the slices were cut pretty unevenly and the crust had a couple charred bubbles.",
    likesCount: 41,
    bookmarksCount: 14,
    sharesCount: 4,
    viewsCount: 488,
    hoursAgo: 140
  },

  // 9-10. Jack T (usr_alex_carter) -> +2 reviews (total 3)
  {
    reviewId: "rev_w3_mcdonalds_49",
    reviewerId: "usr_alex_carter",
    placeId: "mcdonalds.com",
    placeName: "McDonald's",
    category: "Fast Food Restaurant",
    rating: 2,
    photoFilename: "rev_w3_mcdonalds_49_mcdonalds_com.jpg",
    dishOrItem: "Cheeseburger & Medium Fries",
    caption: "Burger came out flat with cheese welded to the wrapper and the medium fry box was barely three-quarters full and lukewarm.",
    likesCount: 62,
    bookmarksCount: 13,
    sharesCount: 7,
    viewsCount: 615,
    hoursAgo: 35
  },
  {
    reviewId: "rev_w3_amazon_50",
    reviewerId: "usr_alex_carter",
    placeId: "amazon.com",
    placeName: "Amazon",
    category: "E-Commerce & Retail",
    rating: 3,
    photoFilename: "rev_w3_amazon_50_amazon_com.jpg",
    dishOrItem: "Next-Day Parcel Delivery",
    caption: "Fast overnight shipping as promised, but the box was left right on the wet mat with a crushed corner and tape peeling loose. Contents survived luckily.",
    likesCount: 49,
    bookmarksCount: 17,
    sharesCount: 5,
    viewsCount: 520,
    hoursAgo: 168
  },

  // 11. Elena R (usr_elena_rostova) -> +1 review (total 2)
  {
    reviewId: "rev_w3_delta_51",
    reviewerId: "usr_elena_rostova",
    placeId: "delta.com",
    placeName: "Delta Air Lines",
    category: "Airlines & Travel",
    rating: 4,
    photoFilename: "rev_w3_delta_51_delta_com.jpg",
    dishOrItem: "Main Cabin Daytime Flight",
    caption: "Smooth boarding, working seatback screen, and friendly crew with quick drink service. Cabin tray table looked a bit scuffed but flight landed early.",
    likesCount: 58,
    bookmarksCount: 25,
    sharesCount: 6,
    viewsCount: 530,
    hoursAgo: 46
  },

  // 12. Lucas (usr_comm_27) -> +1 review (total 2)
  {
    reviewId: "rev_w3_izci_52",
    reviewerId: "usr_comm_27",
    placeId: "izci.be",
    placeName: "Bosch Car Service Izci",
    category: "Auto Repair & Garage",
    rating: 5,
    photoFilename: "rev_w3_izci_52_izci_be.jpg",
    dishOrItem: "Front Brake Inspection & Service",
    caption: "Showed me the exact brake pad wear while the car was up on the lift and quoted a fair price upfront with zero surprise add-ons.",
    likesCount: 47,
    bookmarksCount: 23,
    sharesCount: 5,
    viewsCount: 430,
    hoursAgo: 62
  },

  // 13. CoffeeFox (usr_comm_35) -> +1 review (total 2)
  {
    reviewId: "rev_w3_seveneleven_53",
    reviewerId: "usr_comm_35",
    placeId: "7-eleven.com",
    placeName: "7-Eleven",
    category: "Convenience Store",
    rating: 3,
    photoFilename: "rev_w3_seveneleven_53_7_eleven_com.jpg",
    dishOrItem: "Late-Night Coffee & Egg Salad Sandwich",
    caption: "Lifesaver when everything else is closed after midnight. Coffee was hot enough, sandwich bread was slightly dry around the edges.",
    likesCount: 34,
    bookmarksCount: 9,
    sharesCount: 2,
    viewsCount: 375,
    hoursAgo: 88
  },

  // 14. Rachel Brooks (usr_comm_31) -> +1 review (total 2)
  {
    reviewId: "rev_w3_easyhotel_54",
    reviewerId: "usr_comm_31",
    placeId: "easyhotel.com",
    placeName: "easyHotel",
    category: "Hotel & Hospitality",
    rating: 2,
    photoFilename: "rev_w3_easyhotel_54_easyhotel_com.jpg",
    dishOrItem: "Windowless Compact Double Room",
    caption: "Central spot for a quick overnight, but there is genuinely no floor space once you open a carry-on suitcase and the windowless room felt stuffy.",
    likesCount: 72,
    bookmarksCount: 31,
    sharesCount: 11,
    viewsCount: 745,
    hoursAgo: 52
  },

  // 15. U/T8V3QZ (usr_comm_23) -> +1 review (total 2)
  {
    reviewId: "rev_w3_mamotcv_55",
    reviewerId: "usr_comm_23",
    placeId: "mamotcv.com",
    placeName: "Mamo TCV",
    category: "Legal Services",
    rating: 4,
    photoFilename: "rev_w3_mamotcv_55_mamotcv_com.jpg",
    dishOrItem: "Commercial Agreement Consultation",
    caption: "Well-prepared team who walked through every contract revision clearly in the meeting room. Follow-up summary took an extra day, otherwise very solid.",
    likesCount: 39,
    bookmarksCount: 18,
    sharesCount: 4,
    viewsCount: 392,
    hoursAgo: 124
  }
];

export async function seedWave3MultiUserReviewsOnly(): Promise<{
  reviewsToAdd: VideoReview[];
  updatedPlacesMap: Map<string, any>;
}> {
  const db = getBunnyDb();
  const reviewsToAdd: VideoReview[] = [];
  const updatedPlacesMap = new Map<string, any>();

  if (!db) {
    return { reviewsToAdd, updatedPlacesMap };
  }

  // Load existing users and existing reviews so we reuse EXACT existing user identities (zero new users)
  const existingUsersById = new Map<string, any>();
  const existingAuthorsById = new Map<string, any>();
  const existingPlacesById = new Map<string, any>();

  try {
    const uRows = await db.execute("SELECT id, name, avatar, bio, data FROM users");
    for (const row of (uRows.rows || []) as any[]) {
      let parsed: any = {};
      try { parsed = typeof row.data === "string" ? JSON.parse(row.data) : (row.data || {}); } catch {}
      existingUsersById.set(String(row.id), {
        id: String(row.id),
        name: row.name || parsed.name || "",
        avatar: row.avatar || parsed.avatar || "",
        bio: row.bio || parsed.bio || "",
        ...parsed
      });
    }
  } catch {}

  const existingReviewCreatedAtById = new Map<string, number>();
  try {
    const rRows = await db.execute("SELECT id, userId, data FROM videoReviews");
    for (const row of (rRows.rows || []) as any[]) {
      let parsed: any = {};
      try { parsed = typeof row.data === "string" ? JSON.parse(row.data) : (row.data || {}); } catch {}
      const rid = String(row.id || parsed.id || "").trim();
      const existingTs = Number(parsed.createdAtMs || (parsed.createdAt ? Date.parse(parsed.createdAt) : 0));
      if (rid && Number.isFinite(existingTs) && existingTs > 0) {
        existingReviewCreatedAtById.set(rid, existingTs);
      }
      const uid = String(row.userId || parsed.userId || parsed.author?.id || "").trim();
      if (uid && parsed.author && !existingAuthorsById.has(uid)) {
        existingAuthorsById.set(uid, parsed.author);
      }
    }
  } catch {}

  try {
    const pRows = await db.execute("SELECT id, name, category, data FROM places");
    for (const row of (pRows.rows || []) as any[]) {
      let parsed: any = {};
      try { parsed = typeof row.data === "string" ? JSON.parse(row.data) : (row.data || {}); } catch {}
      const pObj = {
        ...parsed,
        id: String(row.id),
        name: parsed.name || row.name || String(row.id),
        category: parsed.category || row.category || "Verified Business"
      };
      existingPlacesById.set(String(row.id), pObj);
      if (pObj.brandDomain) existingPlacesById.set(String(pObj.brandDomain), pObj);
    }
  } catch {}

  const publicPhotosDir = path.join(process.cwd(), "public", "uploads", "photos");
  const uploadsPhotosDir = path.join(process.cwd(), "uploads", "photos");
  const now = Date.now();
  const touchedPlaceIds = new Set<string>();
  const touchedUserIds = new Set<string>();

  for (const def of WAVE3_MULTI_REVIEWS) {
    const uRec = existingUsersById.get(def.reviewerId) || {};
    const prevAuthor = existingAuthorsById.get(def.reviewerId) || {};

    const authorName = String(uRec.name || prevAuthor.name || def.reviewerId);
    const authorHandle = String(
      uRec.handle || prevAuthor.handle || `@${authorName.toLowerCase().replace(/[^a-z0-9_]/g, "")}`
    );
    const authorAvatar = String(uRec.avatar || prevAuthor.avatar || "");
    const authorEmail = String(uRec.email || prevAuthor.email || "");
    const authorBio = String(uRec.bio || prevAuthor.bio || "");
    const authorCity = String(uRec.city || prevAuthor.city || "");
    const authorCountry = String(uRec.country || prevAuthor.country || "");
    const authorLocation = String(
      uRec.location || prevAuthor.location || [authorCity, authorCountry].filter(Boolean).join(", ")
    );

    const matchedPlace = existingPlacesById.get(def.placeId) || {};

    // Ensure photo is persisted inside BunnyDB review_photos table as well as disk
    const photoPath = fs.existsSync(path.join(publicPhotosDir, def.photoFilename))
      ? path.join(publicPhotosDir, def.photoFilename)
      : path.join(uploadsPhotosDir, def.photoFilename);

    if (fs.existsSync(photoPath)) {
      try {
        const buf = fs.readFileSync(photoPath);
        const dataUrl = `data:image/jpeg;base64,${buf.toString("base64")}`;
        await db.execute({
          sql: `INSERT INTO review_photos (filename, reviewId, dataUrl, mimeType)
                VALUES (?, ?, ?, 'image/jpeg')
                ON CONFLICT(filename) DO UPDATE SET dataUrl = excluded.dataUrl, updatedAt = CURRENT_TIMESTAMP`,
          args: [def.photoFilename, def.reviewId, dataUrl]
        });
      } catch {}
    }

    // Preserve existing timestamp on redeploy; for fresh inserts offset by +72h so seeded items never outrank real live user reviews
    const existingTs = existingReviewCreatedAtById.get(def.reviewId);
    const reviewCreatedAtMs = existingTs && existingTs > 0
      ? existingTs
      : now - (def.hoursAgo + 72) * 3600 * 1000;
    const photoUrl = `/uploads/photos/${def.photoFilename}`;
    const starVal = Number(def.rating);

    const reviewRecord: VideoReview = {
      id: def.reviewId,
      mediaType: "photo",
      photoUrl,
      thumbnailUrl: photoUrl,
      videoUrl: "",
      userId: def.reviewerId,
      userEmail: authorEmail,
      createdAtMs: reviewCreatedAtMs,
      createdAt: new Date(reviewCreatedAtMs).toISOString(),
      recordedAt: new Date(reviewCreatedAtMs).toISOString(),
      isLocalUpload: true,
      placeId: def.placeId,
      placeName: matchedPlace.name || def.placeName,
      placeCategory: def.category || matchedPlace.category,
      placeAddress: matchedPlace.address || "",
      placeCity: matchedPlace.city || authorCity,
      placeCountry: matchedPlace.country || authorCountry,
      placeRating: starVal,
      placeWebsite: matchedPlace.website || `https://${def.placeId}`,
      placeLogoUrl: matchedPlace.logoUrl || undefined,
      placeBannerUrl: matchedPlace.bannerUrl || undefined,
      authorName,
      authorAvatar,
      author: {
        id: def.reviewerId,
        userId: def.reviewerId,
        name: authorName,
        firstName: uRec.firstName || prevAuthor.firstName || authorName.split(" ")[0],
        lastName: uRec.lastName || prevAuthor.lastName || "",
        handle: authorHandle,
        email: authorEmail,
        avatar: authorAvatar,
        bio: authorBio,
        location: authorLocation,
        city: authorCity,
        country: authorCountry,
        isVerified: true,
        passkeyProtected: true,
        isLocalGuide: Boolean(uRec.isLocalGuide ?? prevAuthor.isLocalGuide ?? true)
      },
      rating: starVal,
      caption: def.caption,
      description: def.caption,
      dishOrItem: def.dishOrItem,
      likes: def.likesCount,
      bookmarksCount: def.bookmarksCount,
      sharesCount: def.sharesCount,
      commentsCount: 0,
      views: def.viewsCount,
      viewsCount: def.viewsCount,
      tags: [def.dishOrItem, def.category, "PhotoReview"],
      isLandscape: false,
      aspectRatio: 3 / 4,
      isReady: true,
      isProcessing: false
    };

    reviewsToAdd.push(reviewRecord);
    touchedPlaceIds.add(def.placeId);
    touchedUserIds.add(def.reviewerId);

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
        starVal,
        "",
        reviewRecord.thumbnailUrl,
        reviewRecord.likes || 0,
        reviewRecord.bookmarksCount || 0,
        reviewRecord.sharesCount || 0,
        0,
        reviewRecord.viewsCount || 0,
        JSON.stringify(reviewRecord)
      ]
    }).catch(() => {});
  }

  // Recompute accurate aggregate ratings & review counts for every touched business
  for (const placeId of touchedPlaceIds) {
    try {
      const revsRes = await db.execute({
        sql: "SELECT rating FROM videoReviews WHERE placeId = ?",
        args: [placeId]
      });
      const ratings = ((revsRes.rows || []) as any[])
        .map((r) => Number(r.rating))
        .filter((n) => n >= 1 && n <= 5);
      if (ratings.length === 0) continue;

      const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let sum = 0;
      for (const r of ratings) {
        const rounded = Math.min(5, Math.max(1, Math.round(r)));
        starCounts[rounded] = (starCounts[rounded] || 0) + 1;
        sum += r;
      }
      const avgRating = Number((sum / ratings.length).toFixed(1));
      const matchedDef = WAVE3_MULTI_REVIEWS.find((d) => d.placeId === placeId);
      const existingPlace = existingPlacesById.get(placeId) || {};
      const fixedCat = matchedDef?.category || existingPlace.category || "Business & Services";
      const catInfo = classifyBusinessCategory({
        rawCategory: fixedCat,
        name: existingPlace.name || matchedDef?.placeName || placeId,
        domain: existingPlace.brandDomain || placeId,
        description: existingPlace.description
      });

      const updatedPlaceData = {
        ...existingPlace,
        id: placeId,
        name: existingPlace.name || matchedDef?.placeName || placeId,
        brandDomain: existingPlace.brandDomain || placeId,
        category: catInfo.specificCategory,
        categoryType: catInfo.canonicalId,
        rating: avgRating,
        totalReviews: ratings.length,
        videoReviewCount: ratings.length,
        ratingCount: ratings.length,
        starCounts,
        ratingDistribution: {
          stars5: starCounts[5],
          stars4: starCounts[4],
          stars3: starCounts[3],
          stars2: starCounts[2],
          stars1: starCounts[1]
        }
      };

      await db.execute({
        sql: `UPDATE places SET category = ?, data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? OR brandDomain = ?`,
        args: [fixedCat, JSON.stringify(updatedPlaceData), placeId, placeId]
      });
      updatedPlacesMap.set(placeId, updatedPlaceData);
    } catch {}
  }

  // Update review counts on the 10 existing user records (no new users created)
  for (const uid of touchedUserIds) {
    try {
      const countRes = await db.execute({
        sql: "SELECT COUNT(*) as cnt FROM videoReviews WHERE userId = ?",
        args: [uid]
      });
      const cnt = Number(((countRes.rows || [])[0] as any)?.cnt || 0);
      const uRec = existingUsersById.get(uid);
      if (uRec && cnt > 0) {
        const updatedUser = {
          ...uRec,
          videoReviewCount: cnt,
          photosCount: cnt,
          updatedAt: new Date().toISOString()
        };
        await db.execute({
          sql: "UPDATE users SET data = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
          args: [JSON.stringify(updatedUser), uid]
        });
      }
    } catch {}
  }

  return { reviewsToAdd, updatedPlacesMap };
}
