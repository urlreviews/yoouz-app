import React, { useState } from "react";
import { Copy, Check, ExternalLink, ArrowLeft, Monitor, Smartphone, Maximize2, Sparkles, Code } from "lucide-react";
import { Place, VideoReview } from "../types";
import { getPlaceSlug } from "../utils/placeUtils";

interface CopoTestEmbedViewProps {
  places: Place[];
  videos: VideoReview[];
  onExit: () => void;
  restrictToPlace?: Place;
}

export const CopoTestEmbedView: React.FC<CopoTestEmbedViewProps> = ({
  places: _places,
  videos: _videos,
  onExit,
  restrictToPlace
}) => {
  const [testSlug, setTestSlug] = useState<string>(() => {
    if (restrictToPlace) {
      return getPlaceSlug(restrictToPlace);
    }
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("slug");
    return querySlug || "yoouz.com";
  });
  const [inputUrl, setInputUrl] = useState<string>(() => {
    if (restrictToPlace) {
      const slug = getPlaceSlug(restrictToPlace);
      return `https://www.yoouz.com/embed/${slug}`;
    }
    const params = new URLSearchParams(window.location.search);
    const querySlug = params.get("slug");
    if (querySlug) {
      return `https://www.yoouz.com/embed/${querySlug}`;
    }
    return "https://www.yoouz.com/embed/yoouz.com";
  });
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile" | "full">("desktop");
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const quickTests = [
    { label: "yoouz.com", slug: "yoouz.com" },
    { label: "lernerandrowe.com", slug: "lernerandrowe.com" },
    { label: "nevadalegalservices.org", slug: "nevadalegalservices.org" },
    { label: "mcveaghfleming.co.nz", slug: "mcveaghfleming.co.nz" },
    { label: "vanlawfirm.com", slug: "vanlawfirm.com" }
  ];

  const handleTestUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let slug = inputUrl.trim();
    if (slug.includes("/embed/")) {
      const parts = slug.split("/embed/");
      slug = parts[parts.length - 1].replace(/\/$/, "");
    } else if (slug.includes("yoouz.com/")) {
      const parts = slug.split("yoouz.com/");
      slug = parts[parts.length - 1].replace(/\/$/, "");
    }
    slug = slug.replace(/^https?:\/\//i, "").replace(/^www\./i, "").trim();
    if (!slug) slug = "yoouz.com";
    setTestSlug(slug);
    setInputUrl(`https://www.yoouz.com/embed/${slug}`);
    setIframeKey((k) => k + 1);
  };

  const handleQuickSelect = (slug: string) => {
    setTestSlug(slug);
    setInputUrl(`https://www.yoouz.com/embed/${slug}`);
    setIframeKey((k) => k + 1);
  };

  const iframeSrc = `/embed/${encodeURIComponent(testSlug)}`;
  const fullEmbedSnippet = `<!-- Yoouz Authentic Video Reviews + Google Rich Snippet (Schema.org) -->
<div class="yoouz-video-embed" style="max-width:390px;margin:0 auto;">
  <iframe src="https://www.yoouz.com/embed/${testSlug}" width="100%" height="520" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture; camera; microphone" style="width:100%; max-width:390px; height:520px; border-radius:24px; border:none; box-shadow:0 20px 40px rgba(0,0,0,0.5); overflow:hidden;" title="Verified Video Reviews for ${testSlug} on Yoouz"></iframe>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "${testSlug}",
      "url": "https://www.yoouz.com/place/${testSlug}"
    },
    "ratingValue": "5.0",
    "bestRating": "5",
    "worstRating": "1",
    "ratingCount": "8"
  }
  </script>
</div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fullEmbedSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="w-full h-full min-h-[100dvh] bg-zinc-950 text-white flex flex-col overflow-y-auto font-sans select-none antialiased">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to App</span>
          </button>

          <div className="h-4 w-[1px] bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-sm font-bold text-white">
              {restrictToPlace ? `Live Embed Preview — ${restrictToPlace.name}` : "Yoouz Live Embed Tester"}
            </h1>
          </div>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 text-xs">
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              previewDevice === "desktop" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Widget (440px)</span>
          </button>
          <button
            onClick={() => setPreviewDevice("mobile")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              previewDevice === "mobile" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (375px)</span>
          </button>
          <button
            onClick={() => setPreviewDevice("full")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-medium ${
              previewDevice === "full" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Full Player (800px)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Test Control Box - Hidden if restricted to a specific business */}
        {!restrictToPlace && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            <form onSubmit={handleTestUrl} className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://www.yoouz.com/embed/yoouz.com"
                  className="w-full bg-zinc-950 border border-zinc-750 text-white font-mono text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
                />
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
              >
                <span>TEST</span>
              </button>
            </form>

            {/* Quick Test Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-semibold text-zinc-400">QUICK TESTS:</span>
              {quickTests.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => handleQuickSelect(t.slug)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition ${
                    testSlug === t.slug
                      ? "bg-amber-400/10 border-amber-400 text-amber-300 font-bold"
                      : "bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Iframe Sandbox Preview Container */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="bg-zinc-850 border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {restrictToPlace ? "Live Widget Embed Preview" : `Live Iframe Test: /embed/${testSlug}`}
              </span>
            </div>
            <a
              href={iframeSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Frame Container */}
          <div className="p-4 sm:p-8 bg-zinc-950/80 flex items-center justify-center min-h-[540px]">
            <div
              className={`transition-all duration-300 relative shadow-2xl rounded-[28px] overflow-hidden border border-zinc-850 bg-black ${
                previewDevice === "desktop"
                  ? "w-full max-w-[390px] h-[520px]"
                  : previewDevice === "mobile"
                  ? "w-[360px] h-[520px]"
                  : "w-full max-w-[440px] h-[560px]"
              }`}
            >
              <iframe
                key={iframeKey}
                src={iframeSrc}
                title="Yoouz Live Embed Preview"
                className="w-full h-full border-0 bg-transparent"
                allow="autoplay; encrypted-media; picture-in-picture; camera; microphone"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
