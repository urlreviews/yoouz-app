import React from "react";
import { ArrowLeft } from "lucide-react";
import { Place, VideoReview } from "../types";
import { CopoSearchView } from "./CopoSearchView";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
}

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  onClose
}) => {
  return (
    <div className="fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 flex flex-col font-sans animate-in slide-in-from-bottom duration-200">
      <div className="w-full flex items-center p-4 sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <button 
          onClick={onClose} 
          className="flex items-center gap-2 text-white hover:text-zinc-200 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>
      
      <CopoSearchView
        places={places}
        videos={videos}
        onSelectVideo={onSelectVideo}
        onOpenPlace={onOpenPlace}
        onRecordForPlace={onRecordForPlace}
        onAddPlace={onAddPlace}
      />
    </div>
  );
};
