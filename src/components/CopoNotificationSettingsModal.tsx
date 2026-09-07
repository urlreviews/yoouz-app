import React, { useState, useEffect } from "react";
import {
  Bell,
  BellOff,
  Heart,
  MessageSquare,
  Mail,
  UserPlus,
  Bookmark,
  X,
  Check,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from "../types";

interface CopoNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: NotificationPreferences;
  onSave: (newSettings: NotificationPreferences) => void;
}

export const CopoNotificationSettingsModal: React.FC<CopoNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [prefs, setPrefs] = useState<NotificationPreferences>(() => ({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(settings || {}),
  }));

  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setPrefs({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        ...settings,
      });
    }
  }, [settings, isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof NotificationPreferences) => {
    const nextPrefs = {
      ...prefs,
      [key]: !prefs[key],
    };
    setPrefs(nextPrefs);
    onSave(nextPrefs);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  const handleMasterToggle = () => {
    const nextState = !prefs.enabled;
    const nextPrefs = {
      ...prefs,
      enabled: nextState,
    };
    setPrefs(nextPrefs);
    onSave(nextPrefs);
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[350] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="relative w-full max-w-lg bg-zinc-950 text-white rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10"
        >
          {/* Mobile Drag Indicator */}
          <div className="sm:hidden w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mt-3 shrink-0" />

          {/* Modal Header */}
          <div className="px-5 pt-4 pb-4 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-inner">
                <Bell className="w-5 h-5 text-zinc-100" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Notification Settings
                </h3>
                <p className="text-xs text-zinc-400 font-medium">
                  Manage alerts, messages, and social updates
                </p>
              </div>
            </div>

            <button
              id="btn-close-notification-settings"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 border border-zinc-800"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="px-5 py-4 overflow-y-auto space-y-5 divide-y divide-zinc-900">
            {/* Master Push/In-App Notification Switch */}
            <div className="bg-zinc-900/70 rounded-2xl p-4 border border-zinc-800 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    prefs.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                  }`}
                >
                  {prefs.enabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      Allow Notifications
                    </span>
                    {prefs.enabled && (
                      <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Receive live in-app pop-ups, activity badges, and chat alerts in real time.
                  </p>
                </div>
              </div>

              {/* Master Switch Button */}
              <button
                id="toggle-master-notifications"
                type="button"
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleMasterToggle}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  prefs.enabled ? "bg-white" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-zinc-950 shadow-lg ring-0 transition duration-200 ease-in-out ${
                    prefs.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Granular Activity Toggles */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Activity & Social Alerts
                </h4>
                {!prefs.enabled && (
                  <span className="text-[11px] text-amber-400 font-semibold">
                    Paused by master switch
                  </span>
                )}
              </div>

              <div className={`space-y-2.5 transition-opacity ${!prefs.enabled ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                {/* 1. Direct Messages */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100">
                        Direct Messages & Recommendations
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Alerts when somebody sends you a private chat or place share
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-notif-messages"
                    type="button"
                    role="switch"
                    aria-checked={prefs.messages}
                    disabled={!prefs.enabled}
                    onClick={() => handleToggle("messages")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prefs.messages && prefs.enabled ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        prefs.messages && prefs.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Likes on Reviews */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100">
                        Likes & Reactions
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        When viewers like your video reviews
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-notif-likes"
                    type="button"
                    role="switch"
                    aria-checked={prefs.likes}
                    disabled={!prefs.enabled}
                    onClick={() => handleToggle("likes")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prefs.likes && prefs.enabled ? "bg-rose-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        prefs.likes && prefs.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Comments & Replies */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100">
                        Comments & Replies
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        When someone comments on your review or replies to your discussion
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-notif-comments"
                    type="button"
                    role="switch"
                    aria-checked={prefs.comments}
                    disabled={!prefs.enabled}
                    onClick={() => handleToggle("comments")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prefs.comments && prefs.enabled ? "bg-sky-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        prefs.comments && prefs.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Followers */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100">
                        New Followers
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        When a community member follows your creator profile
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-notif-follows"
                    type="button"
                    role="switch"
                    aria-checked={prefs.follows}
                    disabled={!prefs.enabled}
                    onClick={() => handleToggle("follows")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prefs.follows && prefs.enabled ? "bg-violet-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        prefs.follows && prefs.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Bookmarks / Saves */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100">
                        Saves & Bookmarks
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        When viewers save your video review to their bucket list
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-notif-bookmarks"
                    type="button"
                    role="switch"
                    aria-checked={prefs.bookmarks}
                    disabled={!prefs.enabled}
                    onClick={() => handleToggle("bookmarks")}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      prefs.bookmarks && prefs.enabled ? "bg-amber-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        prefs.bookmarks && prefs.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Email Notification Section (Future Expansion) */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <span>Email Channel</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Coming soon
                  </span>
                </h4>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-bold text-zinc-200">
                      Email Digests & Alerts
                    </p>
                    <div className="w-9 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center px-0.5 cursor-not-allowed opacity-60">
                      <div className="w-4 h-4 rounded-full bg-zinc-500" />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    At this time, Yoouz delivers all notifications directly inside the app. Email notifications will be introduced in an upcoming release.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="px-5 py-4 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{hasSaved ? "Preferences updated" : "Auto-saved"}</span>
            </div>

            <button
              id="btn-done-notification-settings"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
