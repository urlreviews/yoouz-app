const fs = require('fs');
let code = fs.readFileSync('src/components/CopoNotificationsView.tsx', 'utf8');

const targetOld = `              return (
                <div
                  key={\`notif-\${notif.id}\`}
                  onClick={() => {
                    handleMarkAsRead(notif.id);
                    if (notif.type === "message" && onNavigateToMessages) {
                      onNavigateToMessages();
                    } else if (notif.type === "follow" && notif.user?.name && onOpenCreator) {
                      const isYoouzTeam =
                        (notif.user.name || "").toLowerCase().includes("yoouz") ||
                        (notif.user.email || "").toLowerCase().includes("yoouz") ||
                        (notif.user.email || "").toLowerCase().includes("admin");
                      if (!isYoouzTeam) {
                        onOpenCreator({
                          name: notif.user.name,
                          avatar: notif.user.avatar,
                          handle: notif.user.name.toLowerCase().replace(/\\s+/g, ""),
                          isFollowed: false
                        });
                      }
                    } else if (notif.videoId) {
                      onSelectNotificationVideo(notif.videoId);
                    }
                  }}
                  className={\`group relative p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 hover:bg-zinc-800/60 active:bg-zinc-800 cursor-pointer transition-colors \${
                    !notif.isRead ? "bg-zinc-800/30" : ""
                  }\`}
                >`;

const targetNew = `              return (
                <motion.div
                  key={\`notif-\${notif.id}\`}
                  initial={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden", transition: { duration: 0.2 } }}
                  className="relative overflow-hidden bg-rose-600 group"
                >
                  {/* Swipe-to-delete Red Backdrop */}
                  <div 
                    onClick={(e) => handleDismiss(notif.id, e)}
                    className="absolute inset-y-0 right-0 w-24 bg-rose-600 text-white flex items-center justify-center gap-1.5 font-bold text-xs cursor-pointer select-none active:bg-rose-700 z-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </div>

                  {/* Drag Front Card */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -90, right: 0 }}
                    dragElastic={0.1}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -60 || info.velocity.x < -250) {
                        handleDismiss(notif.id);
                      }
                    }}
                    onClick={() => {
                      handleMarkAsRead(notif.id);
                      if (notif.type === "message" && onNavigateToMessages) {
                        onNavigateToMessages();
                      } else if (notif.type === "follow" && notif.user?.name && onOpenCreator) {
                        const isYoouzTeam =
                          (notif.user.name || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("yoouz") ||
                          (notif.user.email || "").toLowerCase().includes("admin");
                        if (!isYoouzTeam) {
                          onOpenCreator({
                            name: notif.user.name,
                            avatar: notif.user.avatar,
                            handle: notif.user.name.toLowerCase().replace(/\\s+/g, ""),
                            isFollowed: false
                          });
                        }
                      } else if (notif.videoId) {
                        onSelectNotificationVideo(notif.videoId);
                      }
                    }}
                    className={\`relative z-10 p-3 sm:p-3.5 flex items-center justify-between gap-2.5 sm:gap-3 bg-zinc-900 hover:bg-zinc-850 active:bg-zinc-800 cursor-pointer transition-colors \${
                      !notif.isRead ? "bg-zinc-900" : "bg-zinc-950/80"
                    }\`}
                  >`;

code = code.replace(targetOld, targetNew);

fs.writeFileSync('src/components/CopoNotificationsView.tsx', code);
console.log("Added swipe to delete");
