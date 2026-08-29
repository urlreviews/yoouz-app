import fs from 'fs';
import path from 'path';

// dummy db
const db: any = null;
const adminDb: any = null;
const getDb = () => null;

const serverUploadsDir = path.join(process.cwd(), "uploads");
const reviewsIndexPath = path.join(serverUploadsDir, "reviews_index.json");
const readReviewsIndex = (): any[] => {
  try {
    if (fs.existsSync(reviewsIndexPath)) {
      const raw = fs.readFileSync(reviewsIndexPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
};

async function resolveMetadataForRequest(req: any) {
    const protocol = 'https';
    const host = 'yoouz.com';
    const baseUrl = `${protocol}://${host}`;
    const fullUrl = `${baseUrl}${req.originalUrl || req.url}`;

    const urlObj = new URL(fullUrl);
    const params = urlObj.searchParams;
    const pathname = urlObj.pathname;
    
    let videoId = params.get('video') || params.get('v') || params.get('review');
    let placeId = params.get('place') || params.get('p') || params.get('business') || params.get('domain');
    let creatorHandle = params.get('creator') || params.get('user') || params.get('c');
    let foundUser: any = null;

    if (!videoId) {
      const userVideoMatch = pathname.match(/^\/@([^\/]+)\/video\/([^\/]+)/) || pathname.match(/^\/creator\/([^\/]+)\/video\/([^\/]+)/);
      if (userVideoMatch) {
        creatorHandle = userVideoMatch[1];
        videoId = userVideoMatch[2];
      } else {
        const vMatch = pathname.match(/^\/(v|video|review)\/([^\/]+)/);
        if (vMatch) videoId = vMatch[2];
      }
    }
    if (!creatorHandle) {
      const cMatch = pathname.match(/^\/@([^\/]+)/) || pathname.match(/^\/profile\/([^\/]+)/) || pathname.match(/^\/creator\/([^\/]+)/);
      if (cMatch) creatorHandle = cMatch[1];
    }
    if (!placeId) {
      const pMatch = pathname.match(/^\/place\/([^\/]+)/) || pathname.match(/^\/business\/([^\/]+)/);
      if (pMatch) placeId = pMatch[1];
    }

    let title = "Yoouz: The Authentic Video Review Platform for Business & Software";
    let description = "Yoouz is the premier authentic video review platform. Real people record genuine 60-second live video testimonials. Zero fake text reviews, 100% verified trust.";
    let imageUrl = `${baseUrl}/og-banner.png?v=2`;
    let videoUrl = "";
    let type = "website";
    let structuredData: any = null;
    let keywords = "Yoouz, video reviews, authentic customer reviews, google maps video reviews, 60 second video reviews, restaurant video reviews, local business video ratings";

    try {
      if (videoId) {
        let foundVideo: any = null;
        
        if (!foundVideo) {
          const localList = readReviewsIndex();
          foundVideo = localList.find((v: any) => v.id === videoId);
        }

        if (foundVideo) {
          const authorName = foundVideo.author?.name || foundVideo.authorName || "Verified Customer";
          const authorHandle = foundVideo.author?.handle || authorName.toLowerCase().replace(/\s+/g, "");
          const placeName = foundVideo.placeName || "Local Business";
          const rating = foundVideo.rating || 5.0;
          const caption = foundVideo.caption || "";

          title = `${authorName}'s 60s Video Review of ${placeName} | Yoouz`;
          description = caption 
            ? `"${caption}" — Watch the authentic 60-second video review by ${authorName} for ${placeName} on Yoouz. 100% Real Video. Zero Fake Text Reviews.`
            : `Watch the authentic 60-second video review by ${authorName} for ${placeName} on Yoouz. Real People. Real Reviews.`;
          
          imageUrl = `${baseUrl}/api/og-image.png?type=video&id=${encodeURIComponent(foundVideo.id)}&placeName=${encodeURIComponent(placeName)}&author=${encodeURIComponent(authorName)}&rating=${rating}&caption=${encodeURIComponent(caption)}&v=2`;
          videoUrl = foundVideo.videoUrl || "";
          type = "video.other";
          keywords = `${placeName} review, ${placeName} video review, ${authorName} review, authentic customer video, 60 second review, yoouz video`;
        }
      } else if (placeId || creatorHandle) {
        const placeParam = placeId || "Business";
        const authorParam = creatorHandle || "Reviewer";
        const ratingParam = params.get('rating') || "5";

        title = `${authorParam}'s 60s Video Review of ${placeParam} | Yoouz`;
        description = `"Video review for ${placeParam}" — Watch the authentic 60-second video review by ${authorParam} for ${placeParam} on Yoouz. 100% Real Video. Zero Fake Text Reviews.`;
        imageUrl = `${baseUrl}/api/og-image.png?type=video&placeName=${encodeURIComponent(placeParam)}&author=${encodeURIComponent(authorParam)}&rating=${ratingParam}&v=2`;
        type = "video.other";
      }
    } catch (e) {
      console.error(e);
    }
    return { title, imageUrl };
}

resolveMetadataForRequest({ originalUrl: "/@avr6566gd/video/rev-1787774080951-vuu2k" }).then(console.log);
resolveMetadataForRequest({ originalUrl: "/api/og-image.png?type=video&placeName=londontrustedtherapy.com&author=Reviewer&rating=5&v=3" }).then(console.log);

