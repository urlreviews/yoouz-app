import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, MoreHorizontal, X } from "lucide-react";

export const ADMIN_SURFACE = "bg-[#0c0c0f] border border-white/[0.08] rounded-2xl";
export const ADMIN_SURFACE_SUBTLE = "bg-white/[0.03] border border-white/[0.06] rounded-xl";

export const ADMIN_BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const ADMIN_BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:scale-[0.98] border border-white/[0.08] text-zinc-200 hover:text-white text-xs font-medium transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const ADMIN_BTN_DESTRUCTIVE =
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] border border-rose-500/20 text-rose-400 hover:text-rose-300 text-xs font-medium transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const ADMIN_BTN_DESTRUCTIVE_SOLID =
  "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer whitespace-nowrap";

export const ADMIN_BTN_ICON =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0";

export const ADMIN_BTN_ICON_DANGER =
  "inline-flex items-center justify-center w-8 h-8 rounded-lg bg-transparent hover:bg-rose-500/15 border border-transparent hover:border-rose-500/20 text-zinc-500 hover:text-rose-400 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0";

export const ADMIN_INPUT =
  "h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/25 transition-colors";

export const ADMIN_SELECT =
  "h-9 px-3 rounded-xl bg-[#0c0c0f] border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-white/25 transition-colors cursor-pointer";

export interface AdminActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
}

interface AdminActionMenuProps {
  label?: string;
  items: AdminActionMenuItem[];
  iconOnly?: boolean;
  align?: "left" | "right";
}

export function AdminActionMenu({
  label = "Actions",
  items,
  iconOnly = false,
  align = "right",
}: AdminActionMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={iconOnly ? ADMIN_BTN_ICON : ADMIN_BTN_SECONDARY}
        aria-haspopup="menu"
        aria-expanded={open}
        title={label}
      >
        {iconOnly ? (
          <MoreHorizontal className="w-4 h-4" />
        ) : (
          <>
            <span>{label}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 mt-1.5 top-full ${
            align === "right" ? "right-0" : "left-0"
          } min-w-[200px] py-1.5 rounded-xl bg-[#111115] border border-white/[0.1] shadow-2xl shadow-black/70 backdrop-blur-xl`}
        >
          {items.map((item, idx) => (
            <React.Fragment key={idx}>
              {item.dividerBefore && <div className="my-1 border-t border-white/[0.06]" />}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center gap-2.5 transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer ${
                  item.destructive
                    ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                    : "text-zinc-200 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {item.icon && <span className="shrink-0 opacity-80">{item.icon}</span>}
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AdminPageHeader({ title, subtitle, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.08]">
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  );
}

interface AdminStatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  tone?: "default" | "positive" | "warning" | "danger";
}

export function AdminStatCard({
  label,
  value,
  sublabel,
  icon,
  tone = "default",
}: AdminStatCardProps) {
  const valueTone =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "warning"
      ? "text-amber-400"
      : tone === "danger"
      ? "text-rose-400"
      : "text-white";

  return (
    <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 truncate">
          {label}
        </span>
        {icon && <span className="text-zinc-500 shrink-0">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-2xl font-semibold tracking-tight tabular-nums ${valueTone}`}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {sublabel && <span className="text-[11px] text-zinc-500 truncate">{sublabel}</span>}
      </div>
    </div>
  );
}

interface AdminEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function AdminEmptyState({ icon, title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="bg-[#0c0c0f] border border-white/[0.08] rounded-2xl px-6 py-14 text-center flex flex-col items-center justify-center">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-zinc-500 mb-3">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-white">{title}</p>
      {description && <p className="text-xs text-zinc-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface AdminModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  maxWidthClass = "max-w-lg",
}: AdminModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidthClass} bg-[#0c0c0f] border border-white/[0.1] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-end gap-2 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
