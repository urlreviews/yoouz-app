import React from "react";
import { Place, VideoReview } from "../types";
import { CopoHomePage } from "./CopoHomePage";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
  onOpenNotifications?: () => void;
  unreadNotifsCount?: number;
  searchMode?: "general" | "review";
  autoFocusSearch?: boolean;
}

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  onSelectVideo,
  onOpenPlace,
  onRecordForPlace,
  onAddPlace,
  onClose,
  onOpenNotifications,
  unreadNotifsCount = 0,
  searchMode = "general",
  autoFocusSearch = true
}) => {
  return (
    <div className="fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 flex flex-col font-sans">
      <CopoHomePage
        places={places}
        videos={videos}
        searchMode={searchMode}
        autoFocusSearch={autoFocusSearch}
        onSelectVideo={onSelectVideo}
        onOpenPlace={onOpenPlace}
        onAddPlace={onAddPlace}
        onOpenMenu={onClose}
        onClose={onClose}
        onOpenNotifications={() => {
          onClose();
          if (onOpenNotifications) {
            onOpenNotifications();
          }
        }}
        unreadNotifsCount={unreadNotifsCount}
        onViewAll={() => {
          if (videos.length > 0) onSelectVideo(videos[0].id);
        }}
        onRecordReview={(place) => {
          if (place && onRecordForPlace) {
            onRecordForPlace(place);
          } else if (place && onOpenPlace) {
            onOpenPlace(place.id);
          }
        }}
      />
    </div>
  );
};
