const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const oldPlace = `const newPlace = {
                                id: "new-" + Date.now(),
                                name: formatBusinessName(searchQuery),
                                website: searchQuery,
                                brandDomain: searchQuery,
                                rating: 0,
                                reviewCount: 0,
                                source: 'yoouz' as const,
                                url: searchQuery,
                                reviews: []
                              };`;

const newPlace = `const newPlace = {
                                id: "new-" + Date.now(),
                                name: formatBusinessName(searchQuery),
                                website: searchQuery,
                                brandDomain: searchQuery,
                                rating: 0,
                                reviewCount: 0,
                                source: 'yoouz' as const,
                                url: searchQuery,
                                reviews: [],
                                category: "Local Business",
                                categoryType: "business",
                                address: "Online",
                                city: "Online",
                                state: "N/A",
                                zipCode: "N/A",
                                lat: 0,
                                lng: 0,
                                timezone: "UTC",
                                coverPhotoUrl: "",
                                photoUrls: [],
                                features: [],
                                isVerified: false,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                searchTokens: []
                              } as any;`; // using as any to satisfy type

code = code.replace(oldPlace, newPlace);
fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
