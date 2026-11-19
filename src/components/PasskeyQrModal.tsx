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

        if (!userId && ensureProvisionedRef.current) {
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

  // Create a fresh QR handoff session strictly when modal opens or Save/Restore tab changes
  useEffect(() => {
    if (!isOpen) {
      requestIdRef.current++;
      clearTimers();
      setToken("");
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

  return (
    <div
      id="yoouz-passkey-qr-modal"
      className="fixed inset-0 z-[260] bg-black/85 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] bg-zinc-950 rounded-[32px] border border-zinc-800 shadow-2xl p-6 sm:p-8 text-white space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-lg">
          {status === "completed" ? (
            <Check className="w-7 h-7 text-white stroke-[2.6]" />
          ) : (
            <KeyRound className="w-7 h-7 text-white" />
          )}
        </div>

        {/* Mode Switcher: Save Passkey vs Restore Account */}
        {status !== "completed" && (
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-zinc-800 mx-auto">
            <button
              type="button"
              onClick={() => setMode("save")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                mode === "save"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Save Passkey
            </button>
            <button
              type="button"
              onClick={() => setMode("restore")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                mode === "restore"
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Restore Account
            </button>
          </div>
        )}

        {status === "completed" ? (
          <div className="space-y-2 py-4">
            <h2 className="text-xl font-black tracking-tight text-white">
              {mode === "save" ? "Passkey Saved" : "Account Restored"}
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
              {completedHandle
                ? `${completedHandle} is now active on this computer.`
                : "Your account is now synced on this computer."}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black tracking-tight text-white text-balance">
                {mode === "save" ? "Save Passkey with Your Phone" : "Restore Account with Your Phone"}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto text-balance">
                {mode === "save"
                  ? "Point your phone camera at the QR code below to save a Passkey. This computer will update automatically."
                  : "Point your phone camera at the QR code below to sign in with your saved Passkey on this computer."}
              </p>
            </div>

            {/* QR Frame */}
            <div className="flex flex-col items-center justify-center">
              {status === "loading" ? (
                <div className="w-[240px] h-[240px] rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-2.5 text-zinc-400">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                  <span className="text-xs font-medium">Preparing QR code...</span>
                </div>
              ) : status === "expired" || status === "error" ? (
                <div className="w-[240px] h-[240px] rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center gap-3 p-5 text-center">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {errorMsg || "This QR code has expired."}
                  </p>
                  <button
                    type="button"
                    onClick={() => createSession(mode)}
                    className="px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Generate New QR Code</span>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-5 rounded-3xl inline-flex flex-col items-center justify-center shadow-2xl mx-auto">
                  <QRCodeSVG value={qrUrl} size={200} level="M" includeMargin={false} />
                </div>
              )}
            </div>

            {status === "ready" && (
              <p className="text-[11px] font-medium text-zinc-400">
                Waiting for your phone confirmation...
              </p>
            )}

            {errorMsg && status === "ready" && (
              <p className="text-xs text-amber-300 leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              {qrUrl && status === "ready" && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(qrUrl).catch(() => {});
                    setCopied(true);
                    triggerHaptic("light");
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  <span>{copied ? "Passkey Link Copied" : "Copy Passkey Link"}</span>
                </button>
              )}

              <button
                type="button"
                disabled={isRunningLocal}
                onClick={handleUseThisComputer}
                className="w-full py-2.5 px-4 rounded-2xl bg-transparent hover:bg-zinc-900/80 text-zinc-400 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isRunningLocal ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Laptop className="w-3.5 h-3.5" />
                )}
                <span>Use This Computer Instead</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
