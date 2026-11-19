import React, { useEffect, useState } from "react";
import { X, KeyRound, Check, Loader2, AlertCircle } from "lucide-react";
import {
  createPasskeyCredentialOnly,
  assertPasskeyCredentialOnly,
  applyPasskeyUserToLocalSession,
  detectDevicePasskeyLabel
} from "../lib/passkeyAuth";
import { triggerHaptic } from "../utils/haptics";

interface MobilePasskeyHandoffModalProps {
  token: string | null;
  currentPhoneUserId?: string;
  onClose: () => void;
  onSuccess: (user: any, mode: "save" | "restore") => void;
}

export const MobilePasskeyHandoffModal: React.FC<MobilePasskeyHandoffModalProps> = ({
  token,
  currentPhoneUserId,
  onClose,
  onSuccess
}) => {
  const [phase, setPhase] = useState<"loading" | "ready" | "working" | "completed" | "expired" | "error">("loading");
  const [mode, setMode] = useState<"save" | "restore">("save");
  const [desktopUserId, setDesktopUserId] = useState("");
  const [desktopHandle, setDesktopHandle] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resolvedHandle, setResolvedHandle] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setPhase("loading");
    setErrorMsg(null);

    fetch(`/api/auth/passkey/handoff/${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || data?.status === "expired") {
          setPhase("expired");
          setErrorMsg(data?.error || "This QR code has expired. Generate a new one on your computer.");
          return;
        }
        if (data?.status === "completed") {
          setMode(data.mode === "restore" ? "restore" : "save");
          setResolvedHandle(data.user?.handle || data.user?.name || "");
          setPhase("completed");
          return;
        }
        setMode(data.mode === "restore" ? "restore" : "save");
        setDesktopUserId(String(data.desktopUserId || ""));
        setDesktopHandle(String(data.desktopHandle || ""));
        setPhase("ready");
      })
      .catch(() => {
        if (!cancelled) {
          setPhase("error");
          setErrorMsg("Could not connect. Check your internet connection and try again.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleConfirm = async () => {
    if (!token || phase === "working") return;
    setPhase("working");
    setErrorMsg(null);

    try {
      if (mode === "save") {
        const cred = await createPasskeyCredentialOnly({
          id: desktopUserId,
          name: desktopHandle.replace(/^@+/, "") || desktopUserId
        });

        if (!cred.success || !cred.credentialId) {
          setPhase("ready");
          if (!cred.cancelled) {
            setErrorMsg(cred.error || "Could not save passkey on this phone.");
          }
          return;
        }

        const res = await fetch("/api/auth/passkey/handoff/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            token,
            credentialId: cred.credentialId,
            publicKey: cred.publicKey || "",
            deviceName: cred.deviceName || detectDevicePasskeyLabel()
          })
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.user) {
          setPhase(res.status === 410 || res.status === 404 ? "expired" : "ready");
          setErrorMsg(data?.error || "Could not complete Passkey setup.");
          return;
        }

        applyPasskeyUserToLocalSession(data.user, cred.credentialId);
        setResolvedHandle(data.user.handle || data.user.name || desktopHandle);
        setPhase("completed");
        triggerHaptic("success");
        onSuccess(data.user, "save");
        return;
      }

      // Restore mode
      const assertion = await assertPasskeyCredentialOnly();
      if (!assertion.success || !assertion.credentialId) {
        setPhase("ready");
        if (!assertion.cancelled) {
          setErrorMsg(assertion.error || "No saved passkey found on this phone.");
        }
        return;
      }

      const res = await fetch("/api/auth/passkey/handoff/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          credentialId: assertion.credentialId,
          phoneAnonymousUserId: currentPhoneUserId || ""
        })
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.user) {
        setPhase(res.status === 410 ? "expired" : "ready");
        setErrorMsg(data?.error || "No Yoouz account found for this Passkey.");
        return;
      }

      applyPasskeyUserToLocalSession(data.user, assertion.credentialId);
      setResolvedHandle(data.user.handle || data.user.name || "");
      setPhase("completed");
      triggerHaptic("success");
      onSuccess(data.user, "restore");
    } catch {
      setPhase("ready");
      setErrorMsg("Network error. Please try again.");
    }
  };

  if (!token) return null;

  const formattedHandle = desktopHandle
    ? desktopHandle.startsWith("@")
      ? desktopHandle
      : `@${desktopHandle}`
    : "";

  return (
    <div
      id="yoouz-mobile-passkey-handoff"
      className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] bg-zinc-950 rounded-[32px] border border-zinc-800 shadow-2xl p-6 sm:p-7 text-white text-center space-y-6 pb-[calc(env(safe-area-inset-bottom,16px)+24px)] sm:pb-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-lg">
          {phase === "completed" ? (
            <Check className="w-7 h-7 text-white stroke-[2.6]" />
          ) : phase === "expired" || phase === "error" ? (
            <AlertCircle className="w-7 h-7 text-zinc-300" />
          ) : (
            <KeyRound className="w-7 h-7 text-white" />
          )}
        </div>

        {phase === "loading" && (
          <div className="py-6 space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-white mx-auto" />
            <p className="text-sm text-zinc-400">Connecting to your computer...</p>
          </div>
        )}

        {(phase === "ready" || phase === "working") && (
          <>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white text-balance">
                {mode === "save" ? "Save Passkey" : "Restore Account"}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto text-balance">
                {mode === "save"
                  ? formattedHandle
                    ? `Save a Passkey for ${formattedHandle} on this phone. Your computer will update automatically.`
                    : "Save a Passkey on this phone. Your computer will update automatically."
                  : "Verify with your saved Passkey on this phone to sign in on your computer."}
              </p>
            </div>

            {errorMsg && (
              <p className="text-xs text-amber-300 leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            )}

            <div className="pt-1 space-y-2.5">
              <button
                type="button"
                disabled={phase === "working"}
                onClick={handleConfirm}
                className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70"
              >
                {phase === "working" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>
                  {phase === "working"
                    ? "Confirming..."
                    : mode === "save"
                    ? "Save Passkey"
                    : "Restore Account"}
                </span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl text-zinc-400 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {phase === "completed" && (
          <>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {mode === "save" ? "Passkey Saved" : "Account Restored"}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto text-balance">
                {resolvedHandle
                  ? `${resolvedHandle} is now updated on your computer and this phone.`
                  : "Your computer is now updated."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-white hover:bg-zinc-200 active:scale-[0.98] text-zinc-950 font-bold text-sm transition-all cursor-pointer"
            >
              Done
            </button>
          </>
        )}

        {(phase === "expired" || phase === "error") && (
          <>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                {phase === "expired" ? "QR Code Expired" : "Something Went Wrong"}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto text-balance">
                {errorMsg || "Generate a new QR code on your computer and scan it again."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[50px] py-3.5 px-5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};
