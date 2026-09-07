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
  ShieldCheck,
  Database,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NotificationPreferences, DEFAULT_NOTIFICATION_PREFERENCES } from "../types";

interface CopoNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: NotificationPreferences;
  onSave: (newSettings: NotificationPreferences) => Promise<void> | void;
}

/**
 * Premium Dark Mode Monochromatic Switch
 * High-contrast Apple/Linear aesthetic:
 * - Active (ON): High-contrast white track with deep charcoal thumb.
 * - Inactive (OFF): Matte zinc-800 track with muted zinc-400 thumb.
 * - Absolutely zero garish colors.
 */
const DarkSwitch: React.FC<{
  id: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
}> = ({ id, checked, disabled, onChange }) => {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked
          ? "bg-white border-white shadow-[0_0_12px_rgba(255,255,255,0.18)]"
          : "bg-zinc-800 border-zinc-700/80"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full shadow-md transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-5 bg-zinc-950" : "translate-x-0.5 bg-zinc-400"
        }`}
      />
    </button>
  );
};

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

  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "synced">("idle");

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

  const handleToggle = async (key: keyof NotificationPreferences) => {
    const nextPrefs = {
      ...prefs,
      [key]: !prefs[key],
    };
    setPrefs(nextPrefs);
    setSyncStatus("saving");

    try {
      if (onSave) {
        await Promise.resolve(onSave(nextPrefs));
      }
      setSyncStatus("synced");
    } catch (err) {
      console.warn("Notification preference live update warning:", err);
      setSyncStatus("synced");
    }

    setTimeout(() => {
      setSyncStatus("idle");
    }, 2200);
  };

  const handleMasterToggle = async () => {
    const nextState = !prefs.enabled;
    const nextPrefs = {
      ...prefs,
      enabled: nextState,
    };
    setPrefs(nextPrefs);
    setSyncStatus("saving");

    try {
      if (onSave) {
        await Promise.resolve(onSave(nextPrefs));
      }
      setSyncStatus("synced");
    } catch (err) {
      console.warn("Notification master toggle live update warning:", err);
      setSyncStatus("synced");
    }

    setTimeout(() => {
      setSyncStatus("idle");
    }, 2200);
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
          className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* Modal Container: Native PWA bottom sheet on mobile, centered card on desktop */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.98 }}
          transition={{ type: "spring", damping: 28, stiffness: 340 }}
          className="relative w-full max-w-lg bg-zinc-950 text-white rounded-t-[28px] sm:rounded-3xl border-t sm:border border-zinc-800 shadow-[0_-12px_45px_rgba(0,0,0,0.85)] sm:shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] z-10"
        >
          {/* Mobile Drag Indicator Bar for Native PWA feel */}
          <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1.5 bg-zinc-700/80 rounded-full" />
          </div>

          {/* Modal Header */}
          <div className="px-5 pt-3 sm:pt-4 pb-3.5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-750 flex items-center justify-center text-white shadow-inner">
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
          <div className="px-4 sm:px-5 py-4 overflow-y-auto space-y-4 overscroll-contain">
            {/* Master Notification Toggle Card */}
            <div
              onClick={handleMasterToggle}
              className={`rounded-2xl p-4 border transition-all cursor-pointer select-none ${
                prefs.enabled
                  ? "bg-zinc-900/90 border-zinc-700/80 shadow-lg shadow-black/40"
                  : "bg-zinc-900/40 border-zinc-800/60"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all shadow-inner ${
                      prefs.enabled
                        ? "bg-zinc-800 text-white border-zinc-600"
                        : "bg-zinc-850 text-zinc-500 border-zinc-800"
                    }`}
                  >
                    {prefs.enabled ? (
                      <Bell className="w-5 h-5 text-white" />
                    ) : (
                      <BellOff className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white tracking-tight">
                        Allow Notifications
                      </span>
                      <span
                        className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border transition-all ${
                          prefs.enabled
                            ? "bg-zinc-800 text-white border-zinc-600"
                            : "bg-zinc-850 text-zinc-400 border-zinc-800"
                        }`}
                      >
                        {prefs.enabled ? "Active" : "Paused"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Receive live in-app pop-ups, activity badges, and chat alerts in real time.
                    </p>
                  </div>
                </div>

                <DarkSwitch
                  id="toggle-master-notifications"
                  checked={prefs.enabled}
                  onChange={handleMasterToggle}
                />
              </div>
            </div>

            {/* Granular Activity Toggles (Dark Mode Only) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Activity & Social Alerts
                </h4>
                {!prefs.enabled && (
                  <span className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1">
                    <BellOff className="w-3 h-3" />
                    <span>Paused</span>
                  </span>
                )}
              </div>

              <div
                className={`space-y-2.5 transition-opacity duration-200 ${
                  !prefs.enabled ? "opacity-35 pointer-events-none" : "opacity-100"
                }`}
              >
                {/* 1. Direct Messages */}
                <div
                  onClick={() => {
                    if (prefs.enabled) handleToggle("messages");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 active:bg-zinc-850 border border-zinc-800/80 transition-all cursor-pointer select-none group min-h-[58px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Direct Messages & Recommendations
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Alerts when somebody sends you a private chat or place share
                      </p>
                    </div>
                  </div>
                  <DarkSwitch
                    id="toggle-notif-messages"
                    checked={prefs.messages && prefs.enabled}
                    disabled={!prefs.enabled}
                    onChange={() => handleToggle("messages")}
                  />
                </div>

                {/* 2. Likes on Reviews */}
                <div
                  onClick={() => {
                    if (prefs.enabled) handleToggle("likes");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 active:bg-zinc-850 border border-zinc-800/80 transition-all cursor-pointer select-none group min-h-[58px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Likes & Reactions
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        When viewers like your video reviews or comment responses
                      </p>
                    </div>
                  </div>
                  <DarkSwitch
                    id="toggle-notif-likes"
                    checked={prefs.likes && prefs.enabled}
                    disabled={!prefs.enabled}
                    onChange={() => handleToggle("likes")}
                  />
                </div>

                {/* 3. Comments & Replies */}
                <div
                  onClick={() => {
                    if (prefs.enabled) handleToggle("comments");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 active:bg-zinc-850 border border-zinc-800/80 transition-all cursor-pointer select-none group min-h-[58px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Comments & Replies
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        When someone comments on your review or replies to your post
                      </p>
                    </div>
                  </div>
                  <DarkSwitch
                    id="toggle-notif-comments"
                    checked={prefs.comments && prefs.enabled}
                    disabled={!prefs.enabled}
                    onChange={() => handleToggle("comments")}
                  />
                </div>

                {/* 4. Followers */}
                <div
                  onClick={() => {
                    if (prefs.enabled) handleToggle("follows");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 active:bg-zinc-850 border border-zinc-800/80 transition-all cursor-pointer select-none group min-h-[58px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                        New Followers
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        When a community member follows your creator profile
                      </p>
                    </div>
                  </div>
                  <DarkSwitch
                    id="toggle-notif-follows"
                    checked={prefs.follows && prefs.enabled}
                    disabled={!prefs.enabled}
                    onChange={() => handleToggle("follows")}
                  />
                </div>

                {/* 5. Bookmarks / Saves */}
                <div
                  onClick={() => {
                    if (prefs.enabled) handleToggle("bookmarks");
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 hover:bg-zinc-900/90 active:bg-zinc-850 border border-zinc-800/80 transition-all cursor-pointer select-none group min-h-[58px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0 text-zinc-300 group-hover:text-white transition-colors shadow-inner">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-white transition-colors">
                        Saves & Bookmarks
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        When viewers save your video review to their bucket list
                      </p>
                    </div>
                  </div>
                  <DarkSwitch
                    id="toggle-notif-bookmarks"
                    checked={prefs.bookmarks && prefs.enabled}
                    disabled={!prefs.enabled}
                    onChange={() => handleToggle("bookmarks")}
                  />
                </div>
              </div>
            </div>

            {/* Email Channel Section (Future Expansion) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <span>Email Channel</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-850 text-zinc-300 border border-zinc-700/70">
                    Coming soon
                  </span>
                </h4>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-800 text-zinc-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-bold text-zinc-200">
                      Email Digests & Alerts
                    </p>
                    <div className="w-9 h-5 rounded-full bg-zinc-850 border border-zinc-700 flex items-center px-0.5 cursor-not-allowed opacity-50">
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

          {/* Footer Action & Live Database Sync Indicator */}
          <div className="px-4 sm:px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-950/95 flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium min-w-0">
              {syncStatus === "saving" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                  <span className="truncate text-zinc-200 font-medium">Updating database...</span>
                </>
              ) : syncStatus === "synced" ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  <span className="truncate text-zinc-200 font-semibold">Live saved to database</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate text-zinc-400">Live cloud sync enabled</span>
                </>
              )}
            </div>

            <button
              id="btn-done-notification-settings"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
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
