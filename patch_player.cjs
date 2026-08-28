const fs = require('fs');

let player = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

player = player.replace(
  'onLoadMore?: () => void;',
  'onLoadMore?: () => void;\n  currentUser?: any;\n  onDeleteVideo?: (videoId: string) => void;'
);

player = player.replace(
  'onLoadMore\n}) => {',
  'onLoadMore,\n  currentUser,\n  onDeleteVideo\n}) => {'
);

const deleteButton = `
              {currentUser?.email && moreMenuVideo?.userId === currentUser.email && onDeleteVideo && (
                <button
                  id="btn-more-option-delete"
                  onClick={() => {
                    const vidId = moreMenuVideo.id;
                    setMoreMenuVideo(null);
                    onDeleteVideo(vidId);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 group-hover:bg-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-red-400 flex items-center gap-2">
                      <span>Delete Video</span>
                    </div>
                    <div className="text-xs text-red-400/70 mt-0.5 font-medium">
                      Permanently remove this review
                    </div>
                  </div>
                </button>
              )}
`;

player = player.replace(
  '{onOpenReport && (',
  deleteButton + '\n              {onOpenReport && ('
);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', player);

let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  'onHideVideo={(vidId)',
  `currentUser={currentUser}\n              onDeleteVideo={async (vidId) => {
                try {
                  await deleteDoc(doc(db, "videoReviews", vidId));
                  await deleteDoc(doc(db, "videos", vidId)).catch(() => {});
                  
                  const deletedStr = localStorage.getItem("copo_deleted_videos") || "[]";
                  const deletedList = JSON.parse(deletedStr);
                  deletedList.push(vidId);
                  localStorage.setItem("copo_deleted_videos", JSON.stringify(deletedList));
                  
                  setVideos(prev => prev.filter(v => v.id !== vidId));
                } catch(e) {}
              }}\n              onHideVideo={(vidId)`
);

fs.writeFileSync('src/App.tsx', app);
