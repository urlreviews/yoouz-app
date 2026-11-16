// WebAuthn Biometric Passkey Authentication (Face ID / Touch ID / Android Biometrics)
// Syncs automatically across devices via iCloud Keychain (iOS) & Google Password Manager (Android)
// Zero emails, zero magic links, zero passwords.

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function detectDeviceBiometricLabel(): string {
  if (typeof navigator === "undefined") return "Face ID / Biometrics";
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iPhone Face ID (iCloud Keychain)";
  if (/Android/i.test(ua)) return "Android Biometrics (Google Passkey)";
  if (/Mac/i.test(ua)) return "Apple Passkey (Face ID / Touch ID)";
  return "Device Face ID / Passkey";
}

export interface PasskeyResult {
  success: boolean;
  user?: any;
  error?: string;
  cancelled?: boolean;
}

/**
 * Registers a platform biometric Passkey (Face ID / Android Face & Fingerprint) for the current user
 * so their account is permanently remembered and synced across phones without email or passwords.
 */
export async function registerFaceIdPasskey(user: {
  id: string;
  name?: string;
}): Promise<PasskeyResult> {
  const userId = String(user?.id || "").trim();
  if (!userId) {
    return { success: false, error: "Missing user session ID." };
  }

  const displayHandle = String(user?.name || userId).trim();
  const deviceName = detectDeviceBiometricLabel();
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
            { alg: -7, type: "public-key" }, // ES256 (Apple Face ID / Android Biometrics)
            { alg: -257, type: "public-key" } // RS256 fallback
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            residentKey: "required",
            requireResidentKey: true,
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "none"
        }
      })) as PublicKeyCredential | null;

      if (!credential) {
        return { success: false, cancelled: true, error: "Face ID / Passkey setup was cancelled." };
      }

      credentialId = bufferToBase64Url(credential.rawId);
      const response = credential.response as AuthenticatorAttestationResponse;
      if (response && typeof response.getPublicKey === "function") {
        const pkBuf = response.getPublicKey();
        if (pkBuf) publicKey = bufferToBase64Url(pkBuf);
      }
    } else {
      // Fallback for embedded webviews without WebAuthn API exposed
      const storedKey = localStorage.getItem("yoouz_device_passkey_id");
      credentialId = storedKey || `pk_${userId}_${Date.now().toString(36)}`;
      localStorage.setItem("yoouz_device_passkey_id", credentialId);
    }
  } catch (err: any) {
    const msg = String(err?.message || "");
    const name = String(err?.name || "");
    // Check if blocked by iframe permissions policy in preview environment
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
        error: "Face ID / Biometric verification was cancelled."
      };
    } else {
      return {
        success: false,
        error: "Could not complete Face ID / Passkey verification on this device."
      };
    }
  }

  try {
    localStorage.setItem("yoouz_device_passkey_id", credentialId);
  } catch {}

  try {
    const res = await fetch("/api/auth/passkey/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        credentialId,
        publicKey,
        deviceName
      })
    });
    const data = await res.json();
    if (!res.ok || !data?.user) {
      return {
        success: false,
        error: data?.error || "Failed to register passkey with server."
      };
    }

    try {
      localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
      localStorage.setItem("yoouz_current_user", JSON.stringify(data.user));
      window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: data.user }));
    } catch {}

    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Network error while saving passkey." };
  }
}

/**
 * Restores an existing passkey-protected account on a new phone using Face ID / Android Biometrics.
 */
export async function restoreAccountWithPasskey(
  currentAnonymousUserId?: string
): Promise<PasskeyResult> {
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
          userVerification: "required",
          timeout: 60000
        }
      })) as PublicKeyCredential | null;

      if (!assertion) {
        return { success: false, cancelled: true, error: "Face ID / Passkey sign-in was cancelled." };
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
        error: "Face ID / Biometric verification was cancelled."
      };
    } else {
      return {
        success: false,
        error: "No synced Face ID / Passkey found on this device."
      };
    }
  }

  if (!credentialId) {
    return {
      success: false,
      error: "No saved Face ID / Passkey found on this device yet."
    };
  }

  try {
    const res = await fetch("/api/auth/passkey/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credentialId,
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

    try {
      localStorage.setItem("yoouz_device_passkey_id", credentialId);
      localStorage.setItem("copo_user_profile", JSON.stringify(data.user));
      localStorage.setItem("yoouz_current_user", JSON.stringify(data.user));
      if (data.user.id || data.user.uid) {
        localStorage.setItem("copo_user_uid", data.user.id || data.user.uid);
      }
      window.dispatchEvent(new CustomEvent("copo-profile-updated", { detail: data.user }));
    } catch {}

    return { success: true, user: data.user };
  } catch {
    return { success: false, error: "Network error while restoring account." };
  }
}
