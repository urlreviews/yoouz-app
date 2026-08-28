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
    <div className="flex-1 h-full overflow-y-auto bg-zinc-950 text-white p-4 md:p-8" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-white" />
            Food & Friends Clubs
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">
            Join local foodie communities sharing authentic 100% video reviews for top dining spots.
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clubs.map((club, idx) => (
            <div
              key={`club-${club.id}-${idx}`}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-zinc-700 transition-all shadow-xl"
            >
              {/* Club Banner */}
              <div className="relative h-28 w-full bg-zinc-950">
                <img
                  src={club.banner}
                  alt={club.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                <div className="absolute -bottom-4 left-4">
                  <img
                    src={club.avatar}
                    alt={club.name}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-zinc-800 shadow-lg"
                  />
                </div>
              </div>

              {/* Club Info */}
              <div className="p-5 pt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-white">{club.name}</h3>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {club.city}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-medium">{club.description}</p>

                <div className="flex items-center gap-4 text-xs text-zinc-300 pt-2 font-bold">
                  <span className="flex items-center gap-1.5 text-zinc-200">
                    <Video className="w-3.5 h-3.5 text-white" />
                    {club.videoCount} Video Reviews
                  </span>
                  <span>•</span>
                  <span className="text-zinc-400">{club.membersCount} Members</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 flex items-center gap-2">
                <button
                  onClick={() => onSelectClubVideos(club.name)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Watch Club Video Feed
                </button>
                <button
                  onClick={() => onToggleJoinClub(club.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                    club.isJoined
                      ? "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"
                      : "bg-white hover:bg-zinc-200 text-black shadow-md"
                  }`}
                >
                  {club.isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" /> Joined
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 text-black" /> Join
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
