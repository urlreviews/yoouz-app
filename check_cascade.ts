import { resolvePlayableVideoSourcesCascade } from "./src/utils/videoUtils";
const video = {
  id: "rev-hotel-leopold-bizriv",
  videoUrl: "/default-review.mp4",
  thumbnailUrl: "/default-review.mp4",
  author: { name: "Biz Riv" },
  placeName: "Hotel Leopold"
};
const sources = resolvePlayableVideoSourcesCascade(video as any);
console.log(sources);
