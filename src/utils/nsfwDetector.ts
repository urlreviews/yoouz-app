import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";

let modelPromise: Promise<nsfwjs.NSFWJS> | null = null;
let isModelPreloading = false;

/**
 * Preloads the on-device NSFWJS neural network in the background (100% Free, client-side WebGL).
 */
export async function preloadNsfwModel(): Promise<void> {
  if (modelPromise || isModelPreloading) return;
  try {
    isModelPreloading = true;
    modelPromise = nsfwjs.load();
    await modelPromise;
  } catch (err) {
    console.warn("NSFW model preload notice:", err);
    modelPromise = null;
  } finally {
    isModelPreloading = false;
  }
}

export interface OnDeviceModerationResult {
  isSafe: boolean;
  flagged: boolean;
  category?: "Pornography" | "Explicit Content" | "Hentai" | "None";
  confidence?: number;
  reason?: string;
  predictions?: Array<{ className: string; probability: number }>;
}

/**
 * Evaluates an image element, video element, or canvas using on-device TensorFlow.js / NSFWJS.
 * Runs 100% locally on the device GPU/CPU at zero cost.
 */
export async function checkImageSafety(
  element: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): Promise<OnDeviceModerationResult> {
  try {
    if (!modelPromise) {
      modelPromise = nsfwjs.load();
    }
    const model = await modelPromise;
    const predictions = await model.classify(element);

    const porn = predictions.find((p) => p.className === "Porn")?.probability || 0;
    const hentai = predictions.find((p) => p.className === "Hentai")?.probability || 0;
    const sexy = predictions.find((p) => p.className === "Sexy")?.probability || 0;

    // Strict Zero-Tolerance Thresholds:
    // Porn > 35% or Hentai > 45% or combined explicit > 40% -> Flagged immediately
    if (porn > 0.35 || hentai > 0.45 || porn + hentai > 0.40) {
      const topProb = Math.max(porn, hentai);
      return {
        isSafe: false,
        flagged: true,
        category: "Pornography",
        confidence: Math.round(topProb * 100),
        reason: `Explicit nudity or adult content detected by on-device safety filter (${Math.round(
          topProb * 100
        )}% confidence).`,
        predictions
      };
    }

    if (sexy > 0.85) {
      return {
        isSafe: false,
        flagged: true,
        category: "Explicit Content",
        confidence: Math.round(sexy * 100),
        reason: `Inappropriate or excessively suggestive content detected by on-device safety filter (${Math.round(
          sexy * 100
        )}% confidence).`,
        predictions
      };
    }

    return {
      isSafe: true,
      flagged: false,
      category: "None",
      confidence: 0,
      predictions
    };
  } catch (err: any) {
    console.warn("On-device safety classification fallback notice:", err?.message || err);
    return {
      isSafe: true,
      flagged: false,
      reason: "Bypassed on device fallback"
    };
  }
}

/**
 * Checks a Base64 / DataURL frame on-device without sending any data over the network.
 */
export async function checkDataUrlSafety(dataUrl: string): Promise<OnDeviceModerationResult> {
  if (!dataUrl || !dataUrl.startsWith("data:image")) {
    return { isSafe: true, flagged: false };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      try {
        const result = await checkImageSafety(img);
        resolve(result);
      } catch {
        resolve({ isSafe: true, flagged: false });
      }
    };
    img.onerror = () => {
      resolve({ isSafe: true, flagged: false });
    };
    img.src = dataUrl;
  });
}
