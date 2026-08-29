import { normalizeVideoUrl, resolvePlayableVideoSourcesCascade } from './src/utils/videoUtils.ts';
console.log(normalizeVideoUrl("https://rev1.b-cdn.net/videos/rev-1787510734251-tcadw.mp4"));
console.log(resolvePlayableVideoSourcesCascade({id: "rev-1787510734251-tcadw", videoUrl: "https://rev1.b-cdn.net/videos/rev-1787510734251-tcadw.mp4"}));
