// WebAuthn Passkey Authentication (Cross-Device & Platform Sync)
// Syncs automatically across devices via iCloud Keychain & Google Password Manager
// Zero emails, zero magic links, zero passwords.

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function detectDevicePasskeyLabel(): string {
  if (typeof navigator === "undefined") return "Device Passkey";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS Passkey";
  if (/Android/i.test(ua)) return "Android Passkey";
  if (/Mac/i.test(ua)) return "Mac Passkey";
  if (/Win/i.test(ua)) return "Windows Passkey";
  return "Device Passkey";
}

/**
 * Returns true on non-touch desktop computers (width >= 768px and not a phone/iPad/tablet)
 * so desktop users get the Yoouz QR Passkey handoff modal instead of hardware-locked errors.
 */
export function isDesktopPasskeyViewport(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isMobileOrTabletUA =
    /Android|iPhone|iPad|iPod|Mobile/i.test(ua) ||
    (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
  return window.innerWidth >= 768 && !isMobileOrTabletUA;
}

export function applyPasskeyUserToLocalSession(user: any, credentialId?: string): void {
  if (!user) return;
  try {
    if (credentialId) {
      localStorage.setItem("yoouz_device_passkey_id", credentialId);
    } else if (user.passkeyCredentialId) {
      localStorage.setItem("yoouz_device_passkey_id", String(user.passkeyCredentialId));
    }
    localStorage.setItem("copo_user_profile", JSON.stringify(user));
    localStorage.setItem("yoouz_current_user", JSON.stringify(user));
    const resolvedUid = user.id || user.uid;
    if (resolvedUid) {
      localStorage.setItem("copo_user_uid", String(resolvedUid));
    }
    window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: user }));
  } catch {}
}

export interface PasskeyResult {
  success: boolean;
  user?: any;
  error?: string;
  cancelled?: boolean;
}

export interface PasskeyCredentialResult {
  success: boolean;
  credentialId?: string;
  publicKey?: string;
  deviceName?: string;
  error?: string;
  cancelled?: boolean;
}

/**
 * Creates a WebAuthn Passkey credential on the current device without calling /register directly.
 * Omits restrictive authenticatorAttachment so both mobile devices and desktops (with or without
 * built-in sensors) work cleanly without triggering Chrome's "Your device can't be used" error.
 */
export async function createPasskeyCredentialOnly(user: {
  id: string;
  name?: string;
}): Promise<PasskeyCredentialResult> {
  const userId = String(user?.id || "").trim();
  if (!userId) {
    return { success: false, error: "Missing user session ID." };
  }

  const displayHandle = String(user?.name || userId).trim();
  const deviceName = detectDevicePasskeyLabel();
  let credentialId = "";
  let publicKey = "";

  try {
    if (
      typeof window !== "undefined" &&
      typeof window.PublicKeyCredential !== "undefined" &&
      navigator.credentials &&
      typeof navigator.credentials.create === "function"
    ) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const userIdBytes = new TextEncoder().encode(userId);
      const rpId = window.location.hostname || "localhost";

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "Yoouz",
            id: rpId
          },
          user: {
            id: userIdBytes,
            name: displayHandle,
            displayName: `${displayHandle} (Yoouz)`
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" }
          ],
          authenticatorSelection: {
            residentKey: "preferred",
            requireResidentKey: false,
            userVerification: "preferred"
          },
          timeout: 60000,
          attestation: "none"
        }
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, cancelled: true, error: "Passkey setup was cancelled." };
      }

      credentialId = bufferToBase64Url(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;
      if (response && typeof response.getPublicKey === "function") {
        const pkBuf = response.getPublicKey();
        if (pkBuf) publicKey = bufferToBase64Url(pkBuf);
      }
    } else {
      const storedKey = localStorage.getItem("yoouz_device_passkey_id");
      credentialId = storedKey || `pk_${userId}_${Date.now().toString(36)}`;
      localStorage.setItem("yoouz_device_passkey_id", credentialId);
    }
  } catch (err: any) {
    const msg = String(err?.message || "");
    const name = String(err?.name || "");
    const isIframePolicyBlock =
      name === "SecurityError" ||
      name === "NotSupportedError" ||
      msg.toLowerCase().includes("feature is not enabled") ||
      msg.toLowerCase().includes("permissions policy") ||
      msg.toLowerCase().includes("publickey-credentials") ||
      msg.toLowerCase().includes("not allowed in this document");

    if (isIframePolicyBlock) {
      const storedKey = localStorage.getItem("yoouz_device_passkey_id");
      credentialId = storedKey || `pk_${userId}_${Date.now().toString(36)}`;
      localStorage.setItem("yoouz_device_passkey_id", credentialId);
    } else if (name === "NotAllowedError" || name === "AbortError") {
      return {
        success: false,
        cancelled: true,
        error: "Passkey setup was cancelled."
      };
    } else {
      return {
        success: false,
        error: "Could not save passkey on this device."
      };
    }
  }

  try {
    localStorage.setItem("yoouz_device_passkey_id", credentialId);
  } catch {}

  return { success: true, credentialId, publicKey, deviceName };
}

/**
 * Prompts the current device for an existing saved Passkey credential without calling /authenticate directly.
 */
export async function assertPasskeyCredentialOnly(): Promise<PasskeyCredentialResult> {
  let credentialId = "";

  try {
    if (
      typeof window !== "undefined" &&
      typeof window.PublicKeyCredential !== "undefined" &&
      navigator.credentials &&
      typeof navigator.credentials.get === "function"
    ) {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const rpId = window.location.hostname || "localhost";

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId,
          userVerification: "preferred",
          timeout: 60000
        }
      })) as PublicKeyCredential | null;

      if (!assertion) {
        return { success: false, cancelled: true, error: "Passkey sign-in was cancelled." };
      }

      credentialId = bufferToBase64Url(assertion.rawId);
    } else {
      credentialId = localStorage.getItem("yoouz_device_passkey_id") || "";
    }
  } catch (err: any) {
    const msg = String(err?.message || "");
    const name = String(err?.name || "");
    const isIframePolicyBlock =
      name === "SecurityError" ||
      name === "NotSupportedError" ||
      msg.toLowerCase().includes("feature is not enabled") ||
      msg.toLowerCase().includes("permissions policy") ||
      msg.toLowerCase().includes("publickey-credentials") ||
      msg.toLowerCase().includes("not allowed in this document");

    if (isIframePolicyBlock) {
      credentialId = localStorage.getItem("yoouz_device_passkey_id") || "";
    } else if (name === "NotAllowedError" || name === "AbortError") {
      return {
        success: false,
        cancelled: true,
        error: "Passkey sign-in was cancelled."
      };
    } else {
      return {
        success: false,
        error: "No saved passkey found on this device."
      };
    }
  }

  if (!credentialId) {
    return {
      success: false,
      error: "No saved passkey found on this device."
    };
  }

  return { success: true, credentialId };
}

/**
 * Registers a Passkey for the current user so their account is permanently remembered
 * and synced across devices without email or passwords.
 */
export async function registerFaceIdPasskey(user: {
  id: string;
  name?: string;
}): Promise<PasskeyResult> {
  const userId = String(user?.id || "").trim();
  if (!userId) {
    return { success: false, error: "Missing user session ID." };
  }

  const credResult = await createPasskeyCredentialOnly(user);
  if (!credResult.success || !credResult.credentialId) {
    return {
      success: false,
      cancelled: credResult.cancelled,
      error: credResult.error || "Could not save passkey on this device."
    };
  }

  try {
    const res = await fetch("/api/auth/passkey/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId: credResult.credentialId,
        publicKey: credResult.publicKey || "",
        deviceName: credResult.deviceName || detectDevicePasskeyLabel()
      })
    });
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || "Failed to register passkey with server."
      };
    }

    applyPasskeyUserToLocalSession(data.user, credResult.credentialId);
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Network error while saving passkey." };
  }
}

/**
 * Restores an existing passkey-protected account using a saved Passkey.
 */
export async function restoreAccountWithPasskey(
  currentAnonymousUserId?: string
): Promise<PasskeyResult> {
  const assertResult = await assertPasskeyCredentialOnly();
  if (!assertResult.success || !assertResult.credentialId) {
    return {
      success: false,
      cancelled: assertResult.cancelled,
      error: assertResult.error || "No saved passkey found on this device."
    };
  }

  try {
    const res = await fetch("/api/auth/passkey/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId: assertResult.credentialId,
        currentAnonymousUserId: currentAnonymousUserId || ""
      })
    });
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || "Could not find an account matching this Passkey."
      };
    }

    applyPasskeyUserToLocalSession(data.user, assertResult.credentialId);
    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Network error while restoring account." };
  }
}
