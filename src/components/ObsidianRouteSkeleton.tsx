import React from "react";

interface ObsidianRouteSkeletonProps {
  variant?: "page" | "drawer" | "business" | "player";
}

export const ObsidianRouteSkeleton: React.FC<ObsidianRouteSkeletonProps> = ({
  variant = "page"
}) => {
  if (variant === "drawer") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading profile"
        className="w-full md:w-[410px] lg:w-[440px] h-full shrink-0 bg-[#050506] border-r border-white/[0.08] overflow-hidden flex flex-col animate-pulse"
      >
        <div className="w-full h-44 bg-white/[0.05]" />
        <div className="px-5 -mt-9 space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.08] border-4 border-[#050506]" />
          <div className="space-y-2">
            <div className="h-6 w-44 rounded-lg bg-white/[0.08]" />
            <div className="h-3.5 w-32 rounded-md bg-white/[0.05]" />
          </div>
          <div className="h-24 w-full rounded-2xl bg-white/[0.04] border border-white/[0.07]" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="aspect-[3/4] rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
            <div className="aspect-[3/4] rounded-2xl bg-white/[0.04] border border-white/[0.06]" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "player") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading photo review"
        className="flex-1 h-full w-full bg-[#050506] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-[420px] h-[min(78dvh,720px)] rounded-[28px] bg-white/[0.04] border border-white/[0.08] animate-pulse" />
      </div>
    );
  }

  if (variant === "business") {
    return (
      <div
        aria-busy="true"
        aria-label="Loading Yoouz Business"
        className="w-full h-[100dvh] bg-[#050506] flex flex-col"
      >
        <div className="h-16 border-b border-white/[0.08] px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-white/[0.07]" />
            <div className="h-5 w-24 rounded-md bg-white/[0.07]" />
          </div>
          <div className="h-8 w-16 rounded-full bg-white/[0.06] animate-pulse" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-full max-w-md space-y-5 animate-pulse">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] mx-auto" />
            <div className="h-7 w-64 rounded-lg bg-white/[0.08] mx-auto" />
            <div className="h-4 w-72 rounded-md bg-white/[0.05] mx-auto" />
            <div className="h-44 w-full rounded-3xl bg-white/[0.03] border border-white/[0.08]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-busy="true"
      aria-label="Loading view"
      className="flex-1 h-full w-full bg-[#050506] px-4 sm:px-6 md:px-8 py-6 sm:py-8 overflow-hidden"
    >
      <div className="max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/[0.06]" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded-lg bg-white/[0.08]" />
            <div className="h-3.5 w-56 rounded-md bg-white/[0.05]" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-full bg-white/[0.06]" />
          <div className="h-9 w-24 rounded-full bg-white/[0.04]" />
          <div className="h-9 w-24 rounded-full bg-white/[0.04]" />
        </div>
        <div className="h-56 w-full rounded-3xl bg-white/[0.03] border border-white/[0.07]" />
      </div>
    </div>
  );
};
