import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, Video, Zap, MapPin, 
  Sparkles, Award, ArrowRight
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface CopoComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCompetitor?: string;
  onStartReview?: () => void;
}

export function CopoComparisonModal({ 
  isOpen, 
  onClose, 
  initialCompetitor = 'yelp',
  onStartReview 
}: CopoComparisonModalProps) {
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState<'yelp' | 'google' | 'trustpilot' | 'tripadvisor'>(() => {
    if (['yelp', 'google', 'trustpilot', 'tripadvisor'].includes(initialCompetitor.toLowerCase())) {
      return initialCompetitor.toLowerCase() as any;
    }
    return 'yelp';
  });

  if (!isOpen) return null;

  const comparisons = {
    yelp: {
      name: "Yelp",
      tagline: t("comparison.yelpTagline", "Anonymous Text & Aggressive Ad Sales"),
      prosVsCons: [
        { feature: t("comparison.featureReviewFormat", "Review Format"), yoouz: t("comparison.yoouzReviewFormat", "100% Verified 60s Live Video"), competitor: t("comparison.yelpReviewFormat", "Anonymous text & photos"), yoouzWins: true },
        { feature: t("comparison.featureFakeVulnerability", "Fake Review Vulnerability"), yoouz: t("comparison.yoouzFakeVulnerability", "Zero (Live Front Camera Proof)"), competitor: t("comparison.yelpFakeVulnerability", "High (Bots, AI text & paid smear campaigns)"), yoouzWins: true },
        { feature: t("comparison.featureFacialAuthenticity", "Facial & Vocal Authenticity"), yoouz: t("comparison.yoouzFacialAuthenticity", "Real person, voice tone & expressions"), competitor: t("comparison.yelpFacialAuthenticity", "Anonymous usernames with no identity"), yoouzWins: true },
        { feature: t("comparison.featureTimeNeeded", "Time Needed to Understand"), yoouz: t("comparison.yoouzTimeNeeded", "Under 60 seconds instant video"), competitor: t("comparison.yelpTimeNeeded", "3-5 minutes reading biased essays"), yoouzWins: true },
        { feature: t("comparison.featureReviewManipulation", "Review Manipulation / Pay-to-Remove"), yoouz: t("comparison.yoouzReviewManipulation", "Strictly Prohibited & Impossible"), competitor: t("comparison.yelpReviewManipulation", "Aggressive sales & filtered review algorithm"), yoouzWins: true },
        { feature: t("comparison.featureInteractiveUX", "Interactive Video Feed UX"), yoouz: t("comparison.yoouzInteractiveUX", "High-speed vertical feed + Map search"), competitor: t("comparison.yelpInteractiveUX", "Cluttered directories & sponsored ads"), yoouzWins: true }
      ],
      verdict: t("comparison.yelpVerdict", "Yoouz provides authentic, un-faked video evidence in 60 seconds, eliminating the extortion, bot spam, and anonymous 1-star vendettas that plague Yelp.")
    },
    google: {
      name: "Google Reviews",
      tagline: t("comparison.googleTagline", "Unverified Star Ratings & AI Text Floods"),
      prosVsCons: [
        { feature: t("comparison.featureVerification", "Review Verification"), yoouz: t("comparison.yoouzVerification", "Live video capture on the spot"), competitor: t("comparison.googleVerification", "Anyone can rate without visiting"), yoouzWins: true },
        { feature: t("comparison.featureBotResistance", "AI & Bot Spam Resistance"), yoouz: t("comparison.yoouzBotResistance", "100% Immune (Human Video Proof)"), competitor: t("comparison.googleBotResistance", "Heavily targeted by automated review bots"), yoouzWins: true },
        { feature: t("comparison.featureEmotionalNuance", "Emotional Nuance & Atmosphere"), yoouz: t("comparison.yoouzEmotionalNuance", "Live footage, ambiance & honest voice"), competitor: t("comparison.googleEmotionalNuance", "Flat 1-5 star clicks with 2-word blurbs"), yoouzWins: true },
        { feature: t("comparison.featureConciseness", "Conciseness"), yoouz: t("comparison.yoouzConciseness", "Strict 60-second limit"), competitor: t("comparison.googleConciseness", "Unpredictable length, often zero details"), yoouzWins: true },
        { feature: t("comparison.featureSocialProof", "Business Social Proof Value"), yoouz: t("comparison.yoouzSocialProof", "High-converting video testimonials"), competitor: t("comparison.googleSocialProof", "Easily overlooked text snippets"), yoouzWins: true },
        { feature: t("comparison.featureDiscovery", "Place Discovery"), yoouz: t("comparison.yoouzDiscovery", "Reels-style feed + Google Maps integration"), competitor: t("comparison.googleDiscovery", "Map list with sponsored ad pins"), yoouzWins: true }
      ],
      verdict: t("comparison.googleVerdict", "While Google Maps is great for navigation, Google Reviews has become flooded with unverified bot ratings. Yoouz provides undeniable video proof recorded by real humans.")
    },
    trustpilot: {
      name: "Trustpilot",
      tagline: t("comparison.trustpilotTagline", "Paid Review Packages & Anonymous Text Farms"),
      prosVsCons: [
        { feature: t("comparison.featureStandard", "Authenticity Standard"), yoouz: t("comparison.yoouzStandard", "Real customer face & voice on video"), competitor: t("comparison.trustpilotStandard", "Anonymous text easily purchased in bulk"), yoouzWins: true },
        { feature: t("comparison.featureLength", "Review Length"), yoouz: t("comparison.yoouzLength", "Punchy 60-second video insights"), competitor: t("comparison.trustpilotLength", "Long complaints or fake 5-star filler"), yoouzWins: true },
        { feature: t("comparison.featureDirectRecording", "Direct Live Recording"), yoouz: t("comparison.yoouzDirectRecording", "Must record live via app camera"), competitor: t("comparison.trustpilotDirectRecording", "Copy-pasted text submissions"), yoouzWins: true },
        { feature: t("comparison.featureMobileFirst", "Mobile-First UX"), yoouz: t("comparison.yoouzMobileFirst", "Fast swipeable vertical video feed"), competitor: t("comparison.trustpilotMobileFirst", "Static desktop-style review lists"), yoouzWins: true },
        { feature: t("comparison.featureWidgets", "Embeddable Video Widgets"), yoouz: t("comparison.yoouzWidgets", "Dynamic video carousels (3x conversion)"), competitor: t("comparison.trustpilotWidgets", "Static star badges & text quotes"), yoouzWins: true },
        { feature: t("comparison.featureTrustScore", "Consumer Trust Score"), yoouz: t("comparison.yoouzTrustScore", "99.4% Verified Human Authenticity"), competitor: t("comparison.trustpilotTrustScore", "Severely degraded by paid review services"), yoouzWins: true }
      ],
      verdict: t("comparison.trustpilotVerdict", "Trustpilot reviews are easily manipulated by paid review brokers. Yoouz gives businesses and consumers 100% verifiable video testimonials that build genuine trust.")
    },
    tripadvisor: {
      name: "TripAdvisor",
      tagline: t("comparison.tripadvisorTagline", "Outdated Travel Blogs & Static Photos"),
      prosVsCons: [
        { feature: t("comparison.featureAtmosphere", "Live Atmosphere & Food Proof"), yoouz: t("comparison.yoouzAtmosphere", "Fresh 60s video of food, rooms & vibes"), competitor: t("comparison.tripadvisorAtmosphere", "Outdated years-old static photos"), yoouzWins: true },
        { feature: t("comparison.featureSpeed", "Review Speed"), yoouz: t("comparison.yoouzSpeed", "Watch 5 reviews in 3 minutes"), competitor: t("comparison.tripadvisorSpeed", "15 minutes reading multi-page travelogues"), yoouzWins: true },
        { feature: t("comparison.featureHotelReviews", "Fake Hotel Reviews"), yoouz: t("comparison.yoouzHotelReviews", "Live video capture inside the venue"), competitor: t("comparison.tripadvisorHotelReviews", "Anyone can post fake hotel reviews"), yoouzWins: true },
        { feature: t("comparison.featureModernUX", "Modern Mobile UX"), yoouz: t("comparison.yoouzModernUX", "Fast vertical feed + Interactive map"), competitor: t("comparison.tripadvisorModernUX", "Cluttered legacy desktop interface"), yoouzWins: true },
        { feature: t("comparison.featureRealtimeRecs", "Real-time Recommendations"), yoouz: t("comparison.yoouzRealtimeRecs", "Local creators & travelers sharing live"), competitor: t("comparison.tripadvisorRealtimeRecs", "Slow editorial lists & promoted hotels"), yoouzWins: true }
      ],
      verdict: t("comparison.tripadvisorVerdict", "TripAdvisor's static text essays feel obsolete in the video era. Yoouz lets you experience hotels, restaurants, and attractions in raw 60-second video before you arrive.")
    }
  };

  const current = comparisons[selectedTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="relative p-6 sm:p-8 border-b border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950 flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {t("comparison.antiFakeBadge", "THE ANTI-FAKE REVIEW PLATFORM")}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {t("comparison.headline", "Why Yoouz Outperforms Legacy Review Sites")}
          </h2>
          <p className="text-zinc-200 text-sm sm:text-base mt-1.5 max-w-xl">
            {t("comparison.subheadline", "See why millions of consumers and businesses are replacing outdated text reviews with authentic 60-second video testimonials.")}
          </p>

          {/* Competitor Selector Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
            {(['yelp', 'google', 'trustpilot', 'tripadvisor'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === tab
                    ? 'bg-white text-black shadow-lg scale-100'
                    : 'bg-white/5 text-zinc-200 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                vs. {comparisons[tab].name}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* Comparison Matrix Header */}
          <div className="grid grid-cols-12 gap-3 pb-3 border-b border-white/10 text-xs font-bold text-zinc-200 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4">{t("comparison.evaluationCriteria", "Evaluation Criteria")}</div>
            <div className="col-span-7 sm:col-span-4 text-white flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              Yoouz ({t("comparison.videoFirst", "Video First")})
            </div>
            <div className="hidden sm:block sm:col-span-4 text-zinc-200">
              {current.name}
            </div>
          </div>

          {/* Comparison Rows */}
          <div className="space-y-4">
            {current.prosVsCons.map((row, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-12 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors items-center text-sm"
              >
                <div className="col-span-12 sm:col-span-4 font-semibold text-zinc-200">
                  {row.feature}
                </div>
                
                {/* Yoouz Side */}
                <div className="col-span-12 sm:col-span-4 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{row.yoouz}</span>
                </div>

                {/* Competitor Side */}
                <div className="col-span-12 sm:col-span-4 p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 text-zinc-200 flex items-center gap-2">
                  <X className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">{row.competitor}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Summary Verdict Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/10">
            <div className="flex items-center gap-2 text-white font-bold text-sm mb-2">
              <Award className="w-4 h-4 text-amber-400" />
              {t("comparison.officialVerdict", "The Official Verdict: Yoouz vs.")} {current.name}
            </div>
            <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
              {current.verdict}
            </p>
          </div>

          {/* Key Proof Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white">
                <Video className="w-4 h-4" />
              </div>
              <div className="text-white font-bold text-sm">{t("comparison.liveVideoPillar", "100% Live Video")}</div>
              <div className="text-zinc-200 text-xs">{t("comparison.liveVideoDesc", "Real human face, emotion & tone. Zero AI bots.")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-emerald-400">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-white font-bold text-sm">{t("comparison.secondCapPillar", "60-Second Cap")}</div>
              <div className="text-zinc-200 text-xs">{t("comparison.secondCapDesc", "Concise, fast, and 100% respectful of your time.")}</div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-white font-bold text-sm">{t("comparison.globalPlacesPillar", "Global Places")}</div>
              <div className="text-zinc-200 text-xs">{t("comparison.globalPlacesDesc", "Google Maps integration for restaurants & local spots.")}</div>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-6 border-t border-white/10 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
          <div className="text-xs text-zinc-200 text-center sm:text-left">
            {t("comparison.readyPrompt", "Ready to experience authentic, un-faked feedback?")}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              {t("comparison.exploreFeed", "Explore Feed")}
            </button>
            {onStartReview && (
              <button
                onClick={() => {
                  onClose();
                  onStartReview();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <span>{t("comparison.recordReview", "Record a Video Review")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
