import React from "react";
import { Users, Video, Plus, Check } from "lucide-react";
import { Club } from "../types";

interface CopoClubsViewProps {
  clubs: Club[];
  onToggleJoinClub: (clubId: string) => void;
  onSelectClubVideos: (clubName: string) => void;
}

export const CopoClubsView: React.FC<CopoClubsViewProps> = ({
  clubs,
  onToggleJoinClub,
  onSelectClubVideos
}) => {
  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#0a0a0c] text-white p-4 md:p-8" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-400" />
            Food & Friends Clubs
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Join local foodie communities sharing authentic 100% video reviews for top dining spots.
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club, idx) => (
            <div
              key={`club-${club.id}-${idx}`}
              className="bg-[#141418] border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-blue-600/40 transition-all shadow-xl"
            >
              {/* Club Banner */}
              <div className="relative h-28 w-full bg-zinc-900">
                <img
                  src={club.banner}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141418] via-transparent to-transparent" />
                <div className="absolute -bottom-4 left-4">
                  <img
                    src={club.avatar}
                    alt={club.name}
                    className="w-12 h-12 rounded-xl object-cover border-2 border-white/20 shadow-lg"
                  />
                </div>
              </div>

              {/* Club Info */}
              <div className="p-4 pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{club.name}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {club.city}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{club.description}</p>

                <div className="flex items-center gap-4 text-xs text-zinc-300 pt-2 font-medium">
                  <span className="flex items-center gap-1 text-pink-400">
                    <Video className="w-3.5 h-3.5" />
                    {club.videoCount} Video Reviews
                  </span>
                  <span>•</span>
                  <span>{club.membersCount} Members</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  onClick={() => onSelectClubVideos(club.name)}
                  className="flex-1 py-2 rounded-xl bg-[#222228] hover:bg-[#2c2c34] text-white text-xs font-semibold transition-colors"
                >
                  Watch Club Video Feed
                </button>
                <button
                  onClick={() => onToggleJoinClub(club.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    club.isJoined
                      ? "bg-zinc-800 text-zinc-300 border border-white/10"
                      : "bg-blue-600 hover:bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  }`}
                >
                  {club.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Joined
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Join
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
