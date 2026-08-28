import * as faceapi from "@vladmandic/face-api";

let isModelLoading = false;
let isModelLoaded = false;

const CDN_MODEL_PATH = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

/**
 * Initializes face detection models (native or tinyFaceDetector)
 */
export async function initFaceDetection(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  // 1. Check if Shape Detection API is natively supported in browser
  if ("FaceDetector" in window) {
    isModelLoaded = true;
    return true;
  }

  if (isModelLoaded) return true;
  if (isModelLoading) return false;

  isModelLoading = true;
  try {
    // Load lightweight tinyFaceDetector model
    await faceapi.nets.tinyFaceDetector.loadFromUri(CDN_MODEL_PATH);
    isModelLoaded = true;
    isModelLoading = false;
    return true;
  } catch (err) {
    console.warn("Could not load face-api models from CDN, falling back to frame heuristic:", err);
    isModelLoading = false;
    // We allow heuristic fallback
    return false;
  }
}

/**
 * Detects if a human face is present in the video stream
 */
export async function detectFaceInVideo(
  video: HTMLVideoElement
): Promise<{ detected: boolean; box?: { x: number; y: number; width: number; height: number }; confidence?: number }> {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return { detected: false };
  }

  // Method 1: Native FaceDetector (Fastest & hardware-accelerated on Chrome/Android/PWA)
  if ("FaceDetector" in window) {
    try {
      const FaceDetectorClass = (window as any).FaceDetector;
      const detector = new FaceDetectorClass({ fastMode: true, maxDetectedFaces: 2 });
      const faces = await detector.detect(video);
      if (faces && faces.length > 0) {
        const box = faces[0].boundingBox;
        return {
          detected: true,
          box: {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          },
          confidence: 0.95
        };
      }
      return { detected: false };
    } catch (e) {
      // Fall through to face-api
    }
  }

  // Method 2: VladMandic TinyFaceDetector
  if (isModelLoaded && faceapi.nets.tinyFaceDetector.params) {
    try {
      const result = await faceapi.detectSingleFace(
        video,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 })
      );
      if (result) {
        return {
          detected: true,
          box: {
            x: result.box.x,
            y: result.box.y,
            width: result.box.width,
            height: result.box.height
          },
          confidence: result.score
        };
      }
      return { detected: false };
    } catch (e) {
      // Fall through to heuristic
    }
  }

  // Method 3 removed to avoid hand-blocking (skin heuristic) false positives
  return { detected: false };
}