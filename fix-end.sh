sed -i -e '/let geminiRateLimitedUntil = 0;/i\
  }\
\
  return {\
    id: item.id || `place-${Math.random().toString(36).substr(2, 9)}`,\
    name,\
    category,\
    categoryType: item.categoryType || "all",\
    address: addr,\
    city: city || "Global",\
    lat: item.lat || 0,\
    lng: item.lng || 0,\
    rating,\
    totalReviews,\
    ratingDistribution: item.ratingDistribution || { stars5: 100, stars4: 20, stars3: 10, stars2: 5, stars1: 5 },\
    avatarUrl,\
    bannerUrl,\
    photos,\
    openingHours: item.openingHours || "Open ⋅ Closes 10 PM",\
    isOpen,\
    phone,\
    website,\
    priceRange: item.priceRange || "$$",\
    plusCode: item.plusCode || "",\
    description: item.description || "Verified Google Business Listing.",\
    popularKeywords: item.popularKeywords || [{ tag: "All", count: totalReviews }],\
    amenities: item.amenities || ["Verified listing"],\
    topDishes: cleanTopDishes,\
    videoReviewCount: item.videoReviewCount || 0,\
    logoUrl,\
    brandDomain,\
    googleMapsUri,\
    hotelInfo: item.hotelInfo,\
    googleVerified: true\
  };\
}' server.ts
