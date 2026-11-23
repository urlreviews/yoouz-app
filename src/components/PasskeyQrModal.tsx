import React, { useState, useEffect, useCallback, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, KeyRound, Copy, Check, RefreshCw, Loader2, Laptop } from "lucide-react";
import { UserProfile } from "../types";
import {
  registerFaceIdPasskey,
  restoreAccountWithPasskey,
  applyPasskeyUserToLocalSession
} from "../lib/passkeyAuth";
import { triggerHaptic } from "../utils/haptics";

export type PasskeyModalMode = "save" | "restore";

interface PasskeyQrModalProps {
  isOpen: boolean;
  initialMode?: PasskeyModalMode;
  currentUser?: UserProfile | null;
  onEnsureAccountProvisioned?: () => Promise<{ id: string; name?: string } | null>;
  onClose: () => void;
  onSuccess: (user: any, mode: PasskeyModalMode) => void;
}

export const PasskeyQrModal: React.FC<PasskeyQrModalProps> = ({
  isOpen,
  initialMode = "save",
  currentUser,
  onEnsureAccountProvisioned,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<PasskeyModalMode>(initialMode);
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "ready" | "completed" | "expired" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  const [completedHandle, setCompletedHandle] = useState<string>("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef<number>(0);

  // Keep latest props in refs so parent re-renders never reset or blink the QR code
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const ensureProvisionedRef = useRef(onEnsureAccountProvisioned);
  ensureProvisionedRef.current = onEnsureAccountProvisioned;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const clearTimers = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const createSession = useCallback(
    async (targetMode: PasskeyModalMode) => {
      const reqId = ++requestIdRef.current;
      clearTimers();
      setStatus("loading");
      setErrorMsg(null);
      setCopied(false);

      try {
        const latestUser = currentUserRef.current;
        let userId = String(latestUser?.id || (latestUser as any)?.uid || "").trim();
        let handle = String((latestUser as any)?.handle || latestUser?.name || "").trim();

        if (targetMode === "save" && !userId && ensureProvisionedRef.current) {
          const provisioned = await ensureProvisionedRef.current();
          if (reqId !== requestIdRef.current) return;
          if (provisioned?.id) {
            userId = provisioned.id;
            handle = provisioned.name || handle;
          }
        }

        if (targetMode === "save" && !userId) {
          if (reqId !== requestIdRef.current) return;
          setStatus("error");
          setErrorMsg("Could not initialize your account. Please try again.");
          return;
        }

        const res = await fetch("/api/auth/passkey/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: targetMode,
            userId,
            handle
          })
        });
        const data = await res.json();
        if (reqId !== requestIdRef.current) return;
        if (!res.ok || !data?.token) {
          setStatus("error");
          setErrorMsg(data?.error || "Could not generate QR code right now.");
          return;
        }

        setToken(data.token);
        setStatus("ready");
      } catch {
        if (reqId !== requestIdRef.current) return;
        setStatus("error");
        setErrorMsg("Network error while creating QR code.");
      }
    },
    [clearTimers]
  );

  // Create a fresh QR handoff session on desktop strictly when modal opens or Save/Restore tab changes
  useEffect(() => {
    if (!isOpen) {
      requestIdRef.current++;
      clearTimers();
      setToken("");
      setErrorMsg(null);
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setStatus("ready");
      setErrorMsg(null);
      return;
    }
    createSession(mode);
    return () => {
      requestIdRef.current++;
      clearTimers();
    };
  }, [isOpen, mode, createSession, clearTimers]);

  // Poll server every 2s while QR is active to sync desktop instantaneously when phone finishes
  useEffect(() => {
    if (!isOpen || status !== "ready" || !token) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/auth/passkey/handoff/${encodeURIComponent(token)}?claim=1`, {
          credentials: "include"
        });
        if (cancelled) return;

        if (res.status === 404) {
          setStatus("expired");
          clearTimers();
          return;
        }

        const data = await res.json();
        if (cancelled) return;

        if (data?.status === "expired") {
          setStatus("expired");
          clearTimers();
          return;
        }

        if (data?.status === "completed" && data?.user) {
          clearTimers();
          applyPasskeyUserToLocalSession(data.user, data.credentialId);
          setCompletedHandle(data.user.handle || data.user.name || "");
          setStatus("completed");
          triggerHaptic("success");
          onSuccessRef.current(data.user, mode);
          closeTimerRef.current = setTimeout(() => {
            onCloseRef.current();
          }, 1250);
        }
      } catch {
        // Keep polling quietly on transient network hiccup
      }
    };

    pollRef.current = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isOpen, status, token, mode, clearTimers]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleUseThisComputer = async () => {
    if (isRunningLocal) return;
    setIsRunningLocal(true);
    setErrorMsg(null);
    try {
      let userId = String(currentUser?.id || (currentUser as any)?.uid || "").trim();
      let name = String(currentUser?.name || userId).trim();
      if (mode === "save" && !userId && onEnsureAccountProvisioned) {
        const provisioned = await onEnsureAccountProvisioned();
        if (provisioned?.id) {
          userId = provisioned.id;
          name = provisioned.name || userId;
        }
      }

      const result =
        mode === "save"
          ? await registerFaceIdPasskey({ id: userId, name })
          : await restoreAccountWithPasskey(userId);

      if (result.success && result.user) {
        clearTimers();
        setCompletedHandle(result.user.handle || result.user.name || "");
        setStatus("completed");
        triggerHaptic("success");
        onSuccess(result.user, mode);
        closeTimerRef.current = setTimeout(() => {
          onClose();
        }, 1100);
      } else if (!result.cancelled) {
        setErrorMsg(result.error || "Could not use a Passkey on this computer. Scan the QR code with your phone instead.");
      }
    } catch {
      setErrorMsg("Could not use a Passkey on this computer. Scan the QR code with your phone instead.");
    } finally {
      setIsRunningLocal(false);
    }
  };

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://www.yoouz.com";
  const qrUrl = token ? `${origin}/?passkeyLink=${encodeURIComponent(token)}` : "";
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div
      id="yoouz-passkey-qr-modal"
      className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-[420px] bg-[#0B0B0E] rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-white/[0.09] shadow-[0_24px_80px_rgba(0,0,0,0.85)] px-6 pt-6 sm:p-7 text-white space-y-5 text-center"
        style={{ paddingBottom: "max(1.75rem, env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center mx-auto">
          {status === "completed" ? (
            <Check className="w-6 h-6 text-[#E8C78A] stroke-[2.5]" />
          ) : (
            <KeyRound className="w-5 h-5 text-[#E8C78A]" />
          )}
        </div>

        {/* Mode Switcher: Save Passkey vs Restore Account (only shown when an active account exists to back up) */}
        {status !== "completed" && Boolean(currentUser) && (
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/[0.08] mx-auto">
            <button
              type="button"
              onClick={() => setMode("save")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === "save"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Save Passkey
            </button>
            <button
              type="button"
              onClick={() => setMode("restore")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                mode === "restore"
                  ? "bg-white text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Restore Account
            </button>
          </div>
        )}

        {status === "completed" ? (
          <div className="space-y-2 py-4">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white">
              {mode === "save" ? "Passkey Saved" : "Account Restored"}
            </h2>
            <p className="text-[13.5px] text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {completedHandle
                ? `${completedHandle} is now active on this device.`
                : "Your handle is now synced on this device."}
            </p>
          </div>
        ) : isMobileViewport ? (
          /* Native Mobile Flow: 1-tap Face ID / Touch ID — never asks a phone to scan a QR code */
          <div className="space-y-5 pt-1">
            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white text-balance">
                {mode === "save" ? "Save your profile with Passkey" : "Restore your Yoouz profile"}
              </h2>
              <p className="text-[13.5px] text-zinc-400 leading-relaxed max-w-[300px] mx-auto text-balance">
                {mode === "save"
                  ? "Use Face ID or Touch ID to keep your handle and reviews safe. No email or password required."
                  : "Sign back into your saved Yoouz handle using Face ID or Touch ID on this device."}
              </p>
            </div>

            {errorMsg && (
              <p className="text-[12.5px] text-[#E8C78A] bg-[#E8C78A]/10 border border-[#E8C78A]/20 rounded-xl px-3.5 py-2.5 leading-relaxed">
                {errorMsg}
              </p>
            )}

            <button
              type="button"
              disabled={isRunningLocal}
              onClick={handleUseThisComputer}
              className="w-full h-12 px-5 rounded-full bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-semibold text-[14.5px] tracking-[-0.01em] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {isRunningLocal ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <KeyRound className="w-4 h-4 stroke-[2.2]" />
              )}
              <span>
                {mode === "save" ? "Continue with Face ID / Passkey" : "Restore with Face ID / Passkey"}
              </span>
            </button>
          </div>
        ) : (
          /* Desktop Flow: Phone QR handoff + local device fallback */
          <>
            <div className="space-y-1.5">
              <h2 className="text-[20px] font-bold tracking-[-0.02em] text-white text-balance">
                {mode === "save" ? "Save Passkey with Your Phone" : "Restore Account with Your Phone"}
              </h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed max-w-xs mx-auto text-balance">
                {mode === "save"
                  ? "Scan with your phone camera to back up your handle with Face ID or Touch ID. No email required."
                  : "Scan with your phone camera to restore your saved Yoouz handle on this computer."}
              </p>
            </div>

            {/* QR Frame */}
            <div className="flex flex-col items-center justify-center">
              {status === "loading" ? (
                <div className="w-[228px] h-[228px] rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center gap-2.5 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="text-xs font-medium">Preparing QR code...</span>
                </div>
              ) : status === "expired" || status === "error" ? (
                <div className="w-[228px] h-[228px] rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center gap-3 p-5 text-center">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {errorMsg || "This QR code has expired."}
                  </p>
                  <button
                    type="button"
                    onClick={() => createSession(mode)}
                    className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate New QR Code</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-2xl inline-flex flex-col items-center justify-center shadow-2xl mx-auto">
                  <QRCodeSVG value={qrUrl} size={196} level="M" includeMargin={false} />
                </div>
              )}
            </div>

            {status === "ready" && (
              <p className="text-[11.5px] font-medium text-zinc-500">
                Waiting for your phone confirmation...
              </p>
            )}

            {errorMsg && status === "ready" && (
              <p className="text-xs text-[#E8C78A] leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {qrUrl && status === "ready" && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(qrUrl).catch(() => {});
                    setCopied(true);
                    triggerHaptic("light");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white font-semibold text-[13px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-[#E8C78A]" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{copied ? "Passkey Link Copied" : "Copy Passkey Link"}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isRunningLocal}
                onClick={handleUseThisComputer}
                className="w-full h-10 px-4 rounded-xl bg-transparent hover:bg-white/[0.05] text-zinc-400 hover:text-white font-medium text-[12.5px] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isRunningLocal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Laptop className="w-3.5 h-3.5" />
                )}
                <span>Use This Device Instead</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
