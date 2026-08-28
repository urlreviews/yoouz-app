sed -i '1379,1385c\
    }\
  } else if (textContext.includes("bank") || textContext.includes("בנק") || textContext.includes("sparkasse") || textContext.includes("financial")) {\
    if (!category || category === "Verified Google Business" || category === "Local Business") {\
      category = "Bank & ATM";\
    }\
    const bankPhotoSets = [["https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=1200&auto=format&fit=crop&q=80"]];\
    hash = 0;\
    nameStr = (item.name || rawQuery || textContext || "bank").toLowerCase();' server.ts
