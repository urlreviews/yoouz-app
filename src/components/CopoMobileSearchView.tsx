import React from "react";
import { Place, VideoReview, VideoAuthor, UserProfile } from "../types";
import { CopoHomePage } from "./CopoHomePage";

interface CopoMobileSearchViewProps {
  places: Place[];
  videos: VideoReview[];
  allUsers?: any[];
  currentUser?: UserProfile | null;
  onSelectVideo: (videoId: string) => void;
  onOpenPlace: (placeId: string) => void;
  onOpenCreator?: (author: VideoAuthor) => void;
  onRecordForPlace?: (place: Place) => void;
  onAddPlace?: (place: Place) => void;
  onClose: () => void;
  onOpenNotifications?: () => void;
  unreadNotifsCount?: number;
  searchMode?: "general" | "review";
  autoFocusSearch?: boolean;
  onViewAll?: () => void;
  setIsSearchActive?: (active: boolean) => void;
}

export const CopoMobileSearchView: React.FC<CopoMobileSearchViewProps> = ({
  places,
  videos,
  allUsers = [],
  currentUser = null,
  onSelectVideo,
  onOpenPlace,
  onOpenCreator,
  onRecordForPlace,
  onAddPlace,
  onClose,
  onOpenNotifications,
  unreadNotifsCount = 0,
  searchMode = "general",
  autoFocusSearch = true,
  onViewAll,
  setIsSearchActive
}) => {
  return (
    <div className="fixed inset-0 h-[100dvh] z-[250] bg-zinc-950 flex flex-col font-sans">
      <CopoHomePage
        places={places}
        videos={videos}
        allUsers={allUsers}
        currentUser={currentUser}
        searchMode={searchMode}
        autoFocusSearch={autoFocusSearch}
        setIsSearchActive={setIsSearchActive}
        onSelectVideo={onSelectVideo}
        onOpenPlace={onOpenPlace}
        onOpenCreator={(author) => {
          onClose();
          if (onOpenCreator) {
            onOpenCreator(author);
          }
        }}
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
          onClose();
          if (onViewAll) {
            onViewAll();
          } else if (videos.length > 0) {
            onSelectVideo(videos[0].id);
          }
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
