
// Mocking some functions from placeUtils.ts
function resolveSafeAuthor(v) {
  if (!v) return { name: "User", handle: "@user" };
  const author = v.author || {};
  return {
    id: author.id || v.authorId || v.userId || 'anon',
    name: author.name || v.authorName || "Verified Customer",
    handle: author.handle || v.authorHandle || "@user",
    avatar: author.avatar || v.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || 'User')}&background=random`
  };
}

function getDisplayViews(v) {
  if (!v) return 0;
  return typeof v.views === 'number' ? v.views : (typeof v.viewsCount === 'number' ? v.viewsCount : 0);
}

function normalizeReview(v) {
    const safeAuthor = resolveSafeAuthor(v);
    const computedViews = getDisplayViews(v);
    const videoId = v.id || v.videoId || `rev-${Math.random().toString(36).substring(2, 9)}`;

    return {
      ...v,
      id: videoId,
      views: computedViews,
      viewsCount: computedViews,
      author: safeAuthor
    };
}

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/videos/feed");
    const data = await res.json();
    console.log("Success:", data.success);
    console.log("Videos count:", data.videos.length);
    if (data.videos.length > 0) {
      const normalized = data.videos.map(normalizeReview);
      console.log("Normalized count:", normalized.length);
      console.log("First video ID:", normalized[0].id);
      console.log("First video author:", normalized[0].author.name);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
