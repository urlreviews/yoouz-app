import React, { useState, useEffect } from "react";
import { Clock, Check, ChevronDown, Sparkles, Copy, Calendar, Edit3 } from "lucide-react";

export interface DaySchedule {
  day: string;
  status: "open" | "24h" | "closed";
  openTime: string;
  closeTime: string;
}

interface BusinessHoursManagerProps {
  value: string;
  schedule?: DaySchedule[];
  onChange: (formattedHours: string, schedule: DaySchedule[]) => void;
}

export const TIME_OPTIONS = [
  "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
  "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM",
  "11:00 PM", "11:30 PM", "12:00 AM", "01:00 AM", "02:00 AM", "03:00 AM", "04:00 AM"
];

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: "Monday", status: "open", openTime: "08:00 AM", closeTime: "10:00 PM" },
  { day: "Tuesday", status: "open", openTime: "08:00 AM", closeTime: "10:00 PM" },
  { day: "Wednesday", status: "open", openTime: "08:00 AM", closeTime: "10:00 PM" },
  { day: "Thursday", status: "open", openTime: "08:00 AM", closeTime: "10:00 PM" },
  { day: "Friday", status: "open", openTime: "08:00 AM", closeTime: "10:00 PM" },
  { day: "Saturday", status: "open", openTime: "09:00 AM", closeTime: "11:00 PM" },
  { day: "Sunday", status: "open", openTime: "09:00 AM", closeTime: "11:00 PM" },
];

export function compileScheduleToString(schedule: DaySchedule[]): string {
  // Check if all are 24h
  const all24h = schedule.every((d) => d.status === "24h");
  if (all24h) return "Open 24 Hours (Mon - Sun)";

  // Check if Mon-Fri identical, Sat-Sun identical
  const monFri = schedule.slice(0, 5);
  const satSun = schedule.slice(5);

  const isMonFriSame = monFri.every(
    (d) =>
      d.status === monFri[0].status &&
      d.openTime === monFri[0].openTime &&
      d.closeTime === monFri[0].closeTime
  );

  const isSatSunSame = satSun.every(
    (d) =>
      d.status === satSun[0].status &&
      d.openTime === satSun[0].openTime &&
      d.closeTime === satSun[0].closeTime
  );

  const isAll7Same =
    isMonFriSame &&
    isSatSunSame &&
    monFri[0].status === satSun[0].status &&
    monFri[0].openTime === satSun[0].openTime &&
    monFri[0].closeTime === satSun[0].closeTime;

  if (isAll7Same) {
    if (monFri[0].status === "closed") return "Closed (All Week)";
    if (monFri[0].status === "24h") return "Open 24 Hours (Mon - Sun)";
    return `Everyday: ${monFri[0].openTime} - ${monFri[0].closeTime}`;
  }

  const parts: string[] = [];

  // Mon-Fri part
  if (isMonFriSame) {
    if (monFri[0].status === "closed") {
      parts.push("Mon-Fri: Closed");
    } else if (monFri[0].status === "24h") {
      parts.push("Mon-Fri: Open 24h");
    } else {
      parts.push(`Mon-Fri: ${monFri[0].openTime} - ${monFri[0].closeTime}`);
    }
  } else {
    // Individual weekdays
    monFri.forEach((d) => {
      const shortDay = d.day.slice(0, 3);
      if (d.status === "closed") parts.push(`${shortDay}: Closed`);
      else if (d.status === "24h") parts.push(`${shortDay}: 24h`);
      else parts.push(`${shortDay}: ${d.openTime} - ${d.closeTime}`);
    });
  }

  // Sat-Sun part
  if (isSatSunSame) {
    if (satSun[0].status === "closed") {
      parts.push("Sat-Sun: Closed");
    } else if (satSun[0].status === "24h") {
      parts.push("Sat-Sun: Open 24h");
    } else {
      parts.push(`Sat-Sun: ${satSun[0].openTime} - ${satSun[0].closeTime}`);
    }
  } else {
    satSun.forEach((d) => {
      const shortDay = d.day.slice(0, 3);
      if (d.status === "closed") parts.push(`${shortDay}: Closed`);
      else if (d.status === "24h") parts.push(`${shortDay}: 24h`);
      else parts.push(`${shortDay}: ${d.openTime} - ${d.closeTime}`);
    });
  }

  return parts.join(" • ");
}

export const BusinessHoursManager: React.FC<BusinessHoursManagerProps> = ({
  value,
  schedule,
  onChange,
}) => {
  const [activeMode, setActiveMode] = useState<"builder" | "presets" | "custom">(
    "builder"
  );
  const [days, setDays] = useState<DaySchedule[]>(schedule && schedule.length === 7 ? schedule : DEFAULT_SCHEDULE);
  const [customText, setCustomText] = useState(value || "");
  const [isCopiedNotice, setIsCopiedNotice] = useState(false);

  useEffect(() => {
    if (schedule && schedule.length === 7) {
      setDays(schedule);
    }
  }, [schedule]);

  useEffect(() => {
    setCustomText(value || "");
  }, [value]);

  const handleDayStatusChange = (index: number, status: "open" | "24h" | "closed") => {
    const updated = [...days];
    updated[index] = { ...updated[index], status };
    setDays(updated);
    const formatted = compileScheduleToString(updated);
    setCustomText(formatted);
    onChange(formatted, updated);
  };

  const handleDayTimeChange = (index: number, field: "openTime" | "closeTime", time: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: time, status: "open" };
    setDays(updated);
    const formatted = compileScheduleToString(updated);
    setCustomText(formatted);
    onChange(formatted, updated);
  };

  const handleApplyMondayToWeekdays = () => {
    const mon = days[0];
    const updated = days.map((d, i) => (i < 5 ? { ...d, status: mon.status, openTime: mon.openTime, closeTime: mon.closeTime } : d));
    setDays(updated);
    const formatted = compileScheduleToString(updated);
    setCustomText(formatted);
    onChange(formatted, updated);
    setIsCopiedNotice(true);
    setTimeout(() => setIsCopiedNotice(false), 2000);
  };

  const handleApplyMondayToAll = () => {
    const mon = days[0];
    const updated = days.map((d) => ({ ...d, status: mon.status, openTime: mon.openTime, closeTime: mon.closeTime }));
    setDays(updated);
    const formatted = compileScheduleToString(updated);
    setCustomText(formatted);
    onChange(formatted, updated);
    setIsCopiedNotice(true);
    setTimeout(() => setIsCopiedNotice(false), 2000);
  };

  const handleApplyPreset = (presetSchedule: DaySchedule[], presetText: string) => {
    setDays(presetSchedule);
    setCustomText(presetText);
    onChange(presetText, presetSchedule);
  };

  const PRESETS: {
    title: string;
    subtitle: string;
    badge: string;
    schedule: DaySchedule[];
    text: string;
  }[] = [
    {
      title: "Open 24/7",
      subtitle: "Always open day & night",
      badge: "24 Hours",
      schedule: DEFAULT_SCHEDULE.map((d) => ({ ...d, status: "24h" as const })),
      text: "Open 24 Hours (Mon - Sun)",
    },
    {
      title: "Mon - Fri: 9:00 AM - 5:00 PM",
      subtitle: "Standard corporate & office hours (Weekends closed)",
      badge: "Office",
      schedule: DEFAULT_SCHEDULE.map((d, i) =>
        i < 5
          ? { ...d, status: "open" as const, openTime: "09:00 AM", closeTime: "05:00 PM" }
          : { ...d, status: "closed" as const, openTime: "10:00 AM", closeTime: "04:00 PM" }
      ),
      text: "Mon-Fri: 09:00 AM - 05:00 PM • Sat-Sun: Closed",
    },
    {
      title: "Mon - Fri: 8:00 AM - 10:00 PM",
      subtitle: "Weekend 9:00 AM - 11:00 PM (Dining & Cafes)",
      badge: "Cafe & Dining",
      schedule: [
        { day: "Monday", status: "open" as const, openTime: "08:00 AM", closeTime: "10:00 PM" },
        { day: "Tuesday", status: "open" as const, openTime: "08:00 AM", closeTime: "10:00 PM" },
        { day: "Wednesday", status: "open" as const, openTime: "08:00 AM", closeTime: "10:00 PM" },
        { day: "Thursday", status: "open" as const, openTime: "08:00 AM", closeTime: "10:00 PM" },
        { day: "Friday", status: "open" as const, openTime: "08:00 AM", closeTime: "10:00 PM" },
        { day: "Saturday", status: "open" as const, openTime: "09:00 AM", closeTime: "11:00 PM" },
        { day: "Sunday", status: "open" as const, openTime: "09:00 AM", closeTime: "11:00 PM" },
      ],
      text: "Mon-Fri: 08:00 AM - 10:00 PM • Sat-Sun: 09:00 AM - 11:00 PM",
    },
    {
      title: "Everyday: 10:00 AM - 10:00 PM",
      subtitle: "Retail shopping, boutiques & malls",
      badge: "Retail",
      schedule: DEFAULT_SCHEDULE.map((d) => ({
        ...d,
        status: "open" as const,
        openTime: "10:00 AM",
        closeTime: "10:00 PM",
      })),
      text: "Everyday: 10:00 AM - 10:00 PM",
    },
    {
      title: "Mon - Sat: 8:00 AM - 8:00 PM",
      subtitle: "Sundays closed (Services & Salons)",
      badge: "Services",
      schedule: DEFAULT_SCHEDULE.map((d, i) =>
        i < 6
          ? { ...d, status: "open" as const, openTime: "08:00 AM", closeTime: "08:00 PM" }
          : { ...d, status: "closed" as const, openTime: "10:00 AM", closeTime: "04:00 PM" }
      ),
      text: "Mon-Sat: 08:00 AM - 08:00 PM • Sun: Closed",
    },
  ];

  return (
    <div className="space-y-3">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-300">
            Operating Hours
          </span>
        </div>

        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode("builder")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "builder"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Calendar className="w-3 h-3" /> Day Schedule
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("presets")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "presets"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3" /> Quick Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("custom")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              activeMode === "custom"
                ? "bg-zinc-800 text-white shadow-xs"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Edit3 className="w-3 h-3" /> Custom Text
          </button>
        </div>
      </div>

      {/* Live Formatted Summary Pill */}
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-300 block mb-0.5">
            Active Schedule Preview
          </span>
          <p className="text-xs font-semibold text-white truncate">
            {customText || value || "No operating hours configured"}
          </p>
        </div>
        {(customText || value) && (
          <button
            type="button"
            onClick={() => {
              setCustomText("");
              onChange("", DEFAULT_SCHEDULE.map((d) => ({ ...d, status: "closed" as const })));
            }}
            className="text-[11px] font-bold text-zinc-300 hover:text-rose-400 self-start sm:self-auto cursor-pointer shrink-0"
          >
            Reset
          </button>
        )}
      </div>

      {/* MODE 1: DAY-BY-DAY SCHEDULE BUILDER */}
      {activeMode === "builder" && (
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 space-y-3 animate-in fade-in duration-150">
          {/* Quick batch copy actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-zinc-800/80">
            <span className="text-[11px] font-medium text-zinc-300">
              Set hours per day with time selectors:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleApplyMondayToWeekdays}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy Monday hours to Tuesday through Friday"
              >
                <Copy className="w-2.5 h-2.5" /> Copy Mon → Mon-Fri
              </button>
              <button
                type="button"
                onClick={handleApplyMondayToAll}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-[10px] font-bold text-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
                title="Copy Monday hours to all 7 days"
              >
                <Copy className="w-2.5 h-2.5" /> Copy Mon → All 7 Days
              </button>
            </div>
          </div>

          {isCopiedNotice && (
            <div className="text-[11px] font-bold text-zinc-200 bg-zinc-800/80 border border-zinc-700 rounded-xl px-3 py-1.5 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-zinc-200" /> Schedule applied across days!
            </div>
          )}

          {/* 7 Days List */}
          <div className="space-y-2.5">
            {days.map((d, idx) => {
              const isOpen = d.status === "open";
              const is24h = d.status === "24h";
              const isClosed = d.status === "closed";

              return (
                <div
                  key={d.day}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-zinc-700 transition-colors"
                >
                  {/* Day Label & Indicator */}
                  <div className="flex items-center justify-between sm:justify-start gap-2.5 sm:w-28 shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOpen ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" : is24h ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]" : "bg-zinc-600"
                        }`}
                      />
                      <span className="text-xs font-bold text-white tracking-wide">
                        {d.day}
                      </span>
                    </div>

                    {/* Compact status badge on mobile */}
                    <span className="sm:hidden text-[10px] font-bold text-zinc-300">
                      {isOpen ? `${d.openTime} - ${d.closeTime}` : is24h ? "24 Hours" : "Closed"}
                    </span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDayStatusChange(idx, "open")}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        isOpen
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDayStatusChange(idx, "24h")}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        is24h
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      24h
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDayStatusChange(idx, "closed")}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        isClosed
                          ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      Closed
                    </button>
                  </div>

                  {/* Time Pickers (when Open) */}
                  {isOpen ? (
                    <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                      {/* From Time */}
                      <div className="relative flex-1 sm:max-w-[130px]">
                        <select
                          value={d.openTime}
                          onChange={(e) => handleDayTimeChange(idx, "openTime", e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500 pr-6"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`open-${t}`} value={t} className="bg-zinc-900 text-white">
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      <span className="text-[10px] font-bold text-zinc-300 shrink-0">to</span>

                      {/* To Time */}
                      <div className="relative flex-1 sm:max-w-[130px]">
                        <select
                          value={d.closeTime}
                          onChange={(e) => handleDayTimeChange(idx, "closeTime", e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-500 pr-6"
                        >
                          {TIME_OPTIONS.map((t) => (
                            <option key={`close-${t}`} value={t} className="bg-zinc-900 text-white">
                              {t}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:flex flex-1 justify-end">
                      <span className="text-xs font-medium text-zinc-400 italic px-2 py-1">
                        {is24h ? "Open all 24 hours continuously" : "Closed all day"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: QUICK PRESETS */}
      {activeMode === "presets" && (
        <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-150">
          {PRESETS.map((p, idx) => {
            const isMatch = customText === p.text || value === p.text;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p.schedule, p.text)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  isMatch
                    ? "bg-zinc-800/90 border-zinc-600 shadow-md"
                    : "bg-zinc-950/70 border-zinc-800/90 hover:bg-zinc-900 hover:border-zinc-700"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate">{p.title}</span>
                    <span className="text-[10px] font-bold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/70">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-300 mt-0.5 font-medium">{p.subtitle}</p>
                </div>
                {isMatch && (
                  <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* MODE 3: CUSTOM / MANUAL TEXT */}
      {activeMode === "custom" && (
        <div className="space-y-2 animate-in fade-in duration-150">
          <input
            type="text"
            value={customText}
            onChange={(e) => {
              const val = e.target.value;
              setCustomText(val);
              onChange(val, days);
            }}
            placeholder="e.g. Mon-Fri: 09:00 AM - 06:00 PM, Sat: 10:00 AM - 04:00 PM"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-zinc-500 transition-all placeholder:text-zinc-500"
          />
          <p className="text-[11px] text-zinc-400 pl-1">
            Freeform text for seasonal hours, appointments, or unique arrangements.
          </p>
        </div>
      )}
    </div>
  );
};
