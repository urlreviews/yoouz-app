const fs = require('fs');
let code = fs.readFileSync('src/components/CopoNotificationsView.tsx', 'utf8');

// 1. Add imports
code = code.replace(
  'import React, { useState, useMemo } from "react";',
  'import React, { useState, useMemo } from "react";\nimport { motion, AnimatePresence } from "motion/react";'
);

code = code.replace(
  '  Settings\n} from "lucide-react";',
  '  Settings,\n  Trash2\n} from "lucide-react";'
);

// 2. Replace the Notification Feed Card List rendering
const oldListStart = `{/* Notification Feed Card List */}
        {filteredNotifications.length > 0 ? (
          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/50 overflow-hidden shadow-2xs backdrop-blur-md">
            {filteredNotifications.map((notif) => {`;

const newListStart = `{/* Notification Feed Card List */}
        {filteredNotifications.length > 0 ? (
          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 divide-y divide-zinc-800/50 overflow-hidden shadow-2xs backdrop-blur-md">
            <AnimatePresence initial={false}>
            {filteredNotifications.map((notif) => {`;

code = code.replace(oldListStart, newListStart);

// 3. Replace the notification card item return statement
const oldItemReturn = `                  {/* Right Thumbnail & Dismiss */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    {resolvedThumbnail ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                          if (notif.videoId) {
                            onSelectNotificationVideo(notif.videoId);
                          }
                        }}
                        className="w-11 h-14 sm:w-12 sm:h-15 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 shadow-md relative group-hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                        title="Watch video review"
                      >
                        <img
                          src={resolvedThumbnail}
                          alt="Video review by creator"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (notif.user?.avatar && target.src !== notif.user.avatar) {
                              target.src = notif.user.avatar;
                            } else {
                              target.src = \`/api/avatar?name=\${encodeURIComponent(notif.user.name || "Video")}&background=27272a&color=fff\`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                          <div className="w-4.5 h-4.5 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
                            <Play className="w-2 h-2 fill-white text-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Quick Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="p-1 sm:p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 hover:text-white text-zinc-400 border border-zinc-700/60 transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 cursor-pointer active:scale-90"
                      title="Delete notification"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>`;

const newItemReturn = `                  {/* Right Thumbnail & Desktop Quick Delete */}
                  <div className="flex items-center gap-2 shrink-0 select-none">
                    {resolvedThumbnail ? (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notif.id);
                          if (notif.videoId) {
                            onSelectNotificationVideo(notif.videoId);
                          }
                        }}
                        className="w-11 h-14 sm:w-12 sm:h-15 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-zinc-800 shadow-md relative group-hover:scale-105 active:scale-95 transition-transform duration-200 cursor-pointer"
                        title="Watch video review"
                      >
                        <img
                          src={resolvedThumbnail}
                          alt="Video review by creator"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (notif.user?.avatar && target.src !== notif.user.avatar) {
                              target.src = notif.user.avatar;
                            } else {
                              target.src = \`/api/avatar?name=\${encodeURIComponent(notif.user.name || "Video")}&background=27272a&color=fff\`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-center justify-center">
                          <div className="w-4.5 h-4.5 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center shadow-sm">
                            <Play className="w-2 h-2 fill-white text-white translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Desktop Hover Delete Action Button (Hidden on Mobile for Clean Swipe Gesture) */}
                    <button
                      onClick={(e) => handleDismiss(notif.id, e)}
                      className="hidden sm:flex p-1.5 rounded-full bg-zinc-800/80 hover:bg-rose-600 hover:text-white text-zinc-400 border border-zinc-700/60 transition-all opacity-0 group-hover:opacity-100 cursor-pointer active:scale-90 items-center justify-center"
                      title="Delete notification"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
                </div>
              );
            })}
            </AnimatePresence>
          </div>`;

code = code.replace(oldItemReturn, newItemReturn);

fs.writeFileSync('src/components/CopoNotificationsView.tsx', code);
console.log("Updated CopoNotificationsView");
