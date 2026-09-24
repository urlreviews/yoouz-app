import { VideoReview, Place } from '../types';
import { normalizeVideoUrl } from './videoUtils';
import { formatRecordedDate } from './dateUtils';
import { getVideoBlobFromIndexedDB } from '../lib/videoStorage';

export interface BrandedExportProgress {
  status: 'idle' | 'initializing' | 'loading' | 'rendering' | 'encoding' | 'completed' | 'error';
  progress: number; // 0 to 100
  message: string;
  blobUrl?: string;
  filename?: string;
  error?: string;
}

/**
 * Helper to draw a rounded rectangle on Canvas
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor: string,
  strokeColor?: string,
  strokeWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  if (strokeColor && strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Helper to draw a 5-point star on Canvas with subpixel precision
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor?: string,
  strokeWidth: number = 0
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor && strokeWidth > 0) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Helper to draw the official Yoouz Dark Mode Icon (Black badge with crisp white star)
 */
function drawYoouzDarkIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  yoouzLogoImg?: HTMLImageElement | null
) {
  if (yoouzLogoImg && yoouzLogoImg.complete && yoouzLogoImg.naturalWidth > 0) {
    ctx.save();
    ctx.drawImage(yoouzLogoImg, x, y, size, size);
    ctx.restore();
    return;
  }

  ctx.save();
  const radius = size * 0.28;
  drawRoundedRect(
    ctx,
    x,
    y,
    size,
    size,
    radius,
    '#09090b',
    'rgba(255, 255, 255, 0.22)',
    Math.max(1, size * 0.04)
  );

  // Crisp pure white star in the center matching official Yoouz star vector
  drawStar(
    ctx,
    x + size / 2,
    y + size / 2,
    5,
    size * 0.28,
    size * 0.14,
    '#FFFFFF'
  );
  ctx.restore();
}

/**
 * Helper to draw a vector Clock icon matching lucide-react Clock
 */
function drawClockIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  strokeColor: string = 'rgba(255, 255, 255, 0.9)'
) {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = Math.max(1.3, radius * 0.28);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Outer circle
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Hands: center to 12:00, and center to 2:30
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.52);
  ctx.lineTo(cx, cy);
  ctx.lineTo(cx + radius * 0.42, cy + radius * 0.1);
  ctx.stroke();

  ctx.restore();
}

/**
 * Helper to draw a verified checkmark badge matching website styling (<CheckCircle className="fill-white text-black" />)
 */
function drawVerifiedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number = 10) {
  ctx.save();
  // Pure white solid circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.closePath();

  // Dark checkmark matching lucide-react Check
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.45, y);
  ctx.lineTo(x - radius * 0.1, y + radius * 0.38);
  ctx.lineTo(x + radius * 0.45, y - radius * 0.35);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = radius * 0.38;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/**
 * Renders the studio-grade, Ultra-HD branded overlays onto the canvas frame
 * exactly matching the Share Card design:
 * 1. Top-Left: Star Rating & Venue Pill (★ Yoouz 4.0)
 * 2. Top-Right: NOTHING (Powered by yoouz.com completely removed)
 * 3. Bottom-Left: Reviewer Avatar + Name + "Author • 60s Review"
 * 4. Bottom-Right: Red Dot Live Badge + "yoouz.com"
 */
export function renderBrandedVideoOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string },
  logoImage?: HTMLImageElement | null,
  yoouzLogoImage?: HTMLImageElement | null,
  authorAvatarImage?: HTMLImageElement | null
) {
  // Scale metrics relative to 800px baseline for 16:9 widescreen Full HD layout
  const safeScale = width / 800;

  const rawPlaceName = place?.name || video.placeName || 'Yoouz';
  let placeName = rawPlaceName.trim();
  if (placeName.toLowerCase() === 'yoouz' || placeName.toLowerCase() === 'yoouz.com') {
    placeName = 'Yoouz';
  }

  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const ratingScore = rawRating.toFixed(1);
  const authorName = video.author?.name || (video as any)?.authorName || 'Steven Akan';
  const subtitle = `${authorName} • 60s Review`;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Ambient dark gradient vignette matching the Share Card
  const vignetteGradient = ctx.createLinearGradient(0, height, 0, 0);
  vignetteGradient.addColorStop(0.0, 'rgba(0, 0, 0, 0.85)');
  vignetteGradient.addColorStop(0.25, 'rgba(0, 0, 0, 0.25)');
  vignetteGradient.addColorStop(0.50, 'rgba(0, 0, 0, 0.0)');
  vignetteGradient.addColorStop(0.80, 'rgba(0, 0, 0, 0.25)');
  vignetteGradient.addColorStop(1.0, 'rgba(0, 0, 0, 0.60)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);

  // -------------------------------------------------------------
  // 1. TOP-LEFT VENUE & RATING PILL (Matches Share Modal: ★ PlaceName 4.0)
  // -------------------------------------------------------------
  const pillMarginX = 24 * safeScale;
  const pillMarginY = 28 * safeScale;
  const pillHeight = 32 * safeScale;

  // Text measurements
  ctx.font = `800 ${12 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const nameWidth = ctx.measureText(placeName).width;

  ctx.font = `800 ${11 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const ratingWidth = ctx.measureText(ratingScore).width;

  const starIconSize = 14 * safeScale;
  const pillWidth = pillMarginX + starIconSize + (8 * safeScale) + nameWidth + (10 * safeScale) + ratingWidth + (12 * safeScale);

  // Translucent dark glass background
  drawRoundedRect(
    ctx,
    pillMarginX,
    pillMarginY,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    'rgba(0, 0, 0, 0.70)',
    'rgba(255, 255, 255, 0.20)',
    1.2 * safeScale
  );

  // Gold Star icon
  drawStar(
    ctx,
    pillMarginX + (14 * safeScale),
    pillMarginY + (pillHeight / 2),
    5,
    5.5 * safeScale,
    2.8 * safeScale,
    '#FBBF24'
  );

  // Place Name (White text)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${12 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const nameStartX = pillMarginX + (24 * safeScale);
  ctx.fillText(placeName, nameStartX, pillMarginY + (20 * safeScale));

  // Rating Score (Gold text)
  ctx.fillStyle = '#FBBF24';
  ctx.font = `800 ${11 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(ratingScore, nameStartX + nameWidth + (8 * safeScale), pillMarginY + (20 * safeScale));

  // Note: Top-Right "Powered by yoouz.com" is completely removed per user instruction!

  // -------------------------------------------------------------
  // 2. BOTTOM BAR: Reviewer Info (Left) & yoouz.com Watermark (Right)
  // -------------------------------------------------------------
  const bottomMarginY = height - (32 * safeScale);

  // --- BOTTOM-LEFT: Reviewer Avatar + Name + Subtitle ---
  const avatarRadius = 15 * safeScale;
  const avatarX = 24 * safeScale;
  const avatarY = bottomMarginY - (avatarRadius * 2);

  if (authorAvatarImage && authorAvatarImage.complete && authorAvatarImage.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(authorAvatarImage, avatarX, avatarY, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#27272a';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `800 ${12 * safeScale}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(authorName.charAt(0).toUpperCase(), avatarX + avatarRadius, avatarY + avatarRadius);
    ctx.restore();
  }

  // Thin ring around avatar
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1.2 * safeScale;
  ctx.stroke();
  ctx.restore();

  // Author Name & 60s Review subtitle
  const textStartX = avatarX + (avatarRadius * 2) + (8 * safeScale);

  // Line 1: Author Name
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${12.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(authorName, textStartX, avatarY + (11 * safeScale));

  // Line 2: Author Name • 60s Review
  ctx.fillStyle = 'rgba(212, 212, 216, 0.95)';
  ctx.font = `500 ${10.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(subtitle, textStartX, avatarY + (24 * safeScale));

  // --- BOTTOM-RIGHT: yoouz.com watermark badge with red live dot ---
  ctx.font = `800 ${10 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const wmText = 'yoouz.com';
  const wmTextWidth = ctx.measureText(wmText).width;
  const redDotRadius = 3 * safeScale;
  const wmPillHeight = 24 * safeScale;
  const wmPillWidth = (10 * safeScale) + (redDotRadius * 2) + (6 * safeScale) + wmTextWidth + (10 * safeScale);
  const wmX = width - wmPillWidth - (24 * safeScale);
  const wmY = bottomMarginY - wmPillHeight;

  drawRoundedRect(
    ctx,
    wmX,
    wmY,
    wmPillWidth,
    wmPillHeight,
    wmPillHeight / 2,
    'rgba(0, 0, 0, 0.65)',
    'rgba(255, 255, 255, 0.20)',
    1.0 * safeScale
  );

  // Pulsing red dot
  const dotCenterX = wmX + (10 * safeScale) + redDotRadius;
  const dotCenterY = wmY + (wmPillHeight / 2);
  ctx.beginPath();
  ctx.arc(dotCenterX, dotCenterY, redDotRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();

  // yoouz.com text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${10 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(wmText, dotCenterX + redDotRadius + (5 * safeScale), wmY + (16 * safeScale));

  ctx.restore();
}

/**
 * Loads an image with CORS handling for canvas rendering
 */
export async function loadCanvasImage(url?: string): Promise<HTMLImageElement | null> {
  if (!url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
    // Timeout fallback
    setTimeout(() => resolve(null), 3000);
  });
}

/**
 * Encodes and downloads a studio-grade, Ultra-HD (1080p / 4K) branded MP4/WebM video review
 * with burned-in overlays, studio dark mode branding, and high bitrate encoding.
 */
/**
 * Export 100% original, lossless raw camera video file directly (Zero compression/transcoding loss)
 */
export async function downloadOriginalLosslessVideo(
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string }
): Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }> {
  try {
    let videoSrc = '';
    if (video.id) {
      try {
        const storedBlobUrl = await getVideoBlobFromIndexedDB(video.id);
        if (storedBlobUrl) {
          videoSrc = storedBlobUrl;
        }
      } catch (e) {
        console.warn('Could not read from IndexedDB', e);
      }
    }

    if (!videoSrc) {
      videoSrc = normalizeVideoUrl(video.videoUrl || '');
    }

    if (!videoSrc) {
      throw new Error('No valid video source found');
    }

    const safePlace = (place?.name || video.placeName || 'venue')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const safeAuthor = (video.author?.name || 'review')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `yoouz-original-raw-${safePlace}-${safeAuthor}.mp4`;

    // Fetch original raw video blob
    const response = await fetch(videoSrc);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, blobUrl, filename };
  } catch (err: any) {
    console.error('Failed to download original lossless video:', err);
    return { success: false, error: err?.message || 'Failed to download original video' };
  }
}

/**
 * Main function to export a branded video with burned-in overlays (MP4 / WebM)
 */
export async function exportBrandedAdVideo(
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string },
  onProgress?: (progress: BrandedExportProgress) => void
): Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }> {
  let videoEl: HTMLVideoElement | null = null;
  let audioContext: AudioContext | null = null;
  let animFrameId: number | null = null;

    let canvasEl: HTMLCanvasElement | null = null;

    const cleanup = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      if (videoEl && videoEl.parentElement) {
        try {
          videoEl.pause();
          videoEl.removeAttribute('src');
          videoEl.load();
          videoEl.parentElement.removeChild(videoEl);
        } catch (e) {}
      }
      if (canvasEl && canvasEl.parentElement) {
        try {
          canvasEl.parentElement.removeChild(canvasEl);
        } catch (e) {}
      }
      if (audioContext) {
        try {
          audioContext.close();
        } catch (e) {}
      }
    };

    try {
      onProgress?.({
        status: 'initializing',
        progress: 5,
        message: 'Preparing Ultra-HD video pipeline & audio channels...',
      });

      // 1. Resolve raw playable video source (IndexedDB blob or network URL)
      let videoSrc = '';
      if (video.id) {
        try {
          const storedBlobUrl = await getVideoBlobFromIndexedDB(video.id);
          if (storedBlobUrl) {
            videoSrc = storedBlobUrl;
          }
        } catch (e) {
          console.warn('Could not read from IndexedDB, falling back to network url', e);
        }
      }

      if (!videoSrc) {
        videoSrc = normalizeVideoUrl(video.videoUrl || '');
      }

      if (!videoSrc) {
        const err = 'No valid video source found for export';
        onProgress?.({ status: 'error', progress: 0, message: err, error: err });
        return { success: false, error: err };
      }

      // 2. Preload Logo Image & Official Yoouz Vector Assets for Canvas
      onProgress?.({
        status: 'loading',
        progress: 15,
        message: 'Loading high-resolution venue & Yoouz master branding...',
      });

      const logoUrl = place?.logoUrl || video.placeLogoUrl;
      const authorAvatarUrl = (video.author as any)?.avatarUrl || video.author?.avatar || (video as any).authorAvatar || "";
      const [logoImg, yoouzLogoImg, authorAvatarImg] = await Promise.all([
        loadCanvasImage(logoUrl),
        loadCanvasImage('/yoouz-avatar-white.svg').then(img => img || loadCanvasImage('/yoouz-avatar-white.png')),
        loadCanvasImage(authorAvatarUrl)
      ]);

      // 3. Create and Attach Video Element to DOM in active viewport (Critical: Prevents browser decoder throttling/freezing)
      videoEl = document.createElement('video');
      videoEl.crossOrigin = 'anonymous';
      videoEl.src = videoSrc;
      videoEl.muted = false;
      videoEl.playsInline = true;
      videoEl.preload = 'auto';
      videoEl.style.position = 'fixed';
      videoEl.style.bottom = '0px';
      videoEl.style.right = '0px';
      videoEl.style.width = '4px';
      videoEl.style.height = '4px';
      videoEl.style.opacity = '0.01';
      videoEl.style.pointerEvents = 'none';
      videoEl.style.zIndex = '999999';
      document.body.appendChild(videoEl);

      await new Promise<void>((resolve, reject) => {
        if (!videoEl) return reject(new Error('Video element destroyed'));
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error('Failed to load video element metadata'));
        setTimeout(() => reject(new Error('Video loading timed out')), 15000);
      });

      const naturalWidth = videoEl.videoWidth || 1080;
      const naturalHeight = videoEl.videoHeight || 1920;
      const duration = videoEl.duration || 5;

      // 4. Set canvas dimensions to 1920x1080 (standard 16:9 widescreen Full HD matching Share layout) for full-screen playback on Facebook, YouTube & Web
      const targetWidth = 1920;
      const targetHeight = 1080;

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.style.position = 'fixed';
      canvas.style.bottom = '0px';
      canvas.style.right = '0px';
      canvas.style.width = '4px';
      canvas.style.height = '4px';
      canvas.style.opacity = '0.01';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '999998';
      document.body.appendChild(canvas);
      canvasEl = canvas;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) throw new Error('Could not create Canvas 2D context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 5. Setup AudioContext and Audio Stream Routing
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;

      if (AudioContextClass) {
        try {
          audioContext = new AudioContextClass();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          const source = audioContext.createMediaElementSource(videoEl);
          audioDestination = audioContext.createMediaStreamDestination();
          source.connect(audioDestination);
        } catch (audioErr) {
          console.warn('AudioContext setup error (video may export without audio):', audioErr);
        }
      }

      // 6. Capture MediaStream from Canvas + Audio Tracks (60fps)
      const canvasStream = canvas.captureStream(60);
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      // 7. Initialize MediaRecorder with Studio-Quality Bitrate
      const mimeTypes = [
        'video/mp4;codecs=avc1.640028,mp4a.40.2',
        'video/mp4;codecs=avc1.4d4028',
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      let chosenMime = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          chosenMime = mime;
          break;
        }
      }

      const recordedChunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(
        canvasStream,
        chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 25000000 } : undefined
      );

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      onProgress?.({
        status: 'rendering',
        progress: 25,
        message: 'Encoding Ultra-HD frames with studio branding...',
      });

      // 8. High-Fidelity Playback & Frame-by-Frame Draw Loop
      let isCancelled = false;

      const drawCurrentFrame = () => {
        if (!videoEl || isCancelled) return;

        // Draw video frame with aspect-ratio cover (no distortion)
        const vRatio = naturalWidth / naturalHeight;
        const cRatio = canvas.width / canvas.height;
        let drawW = canvas.width;
        let drawH = canvas.height;
        let offsetX = 0;
        let offsetY = 0;

        if (vRatio > cRatio) {
          drawW = canvas.height * vRatio;
          offsetX = -(drawW - canvas.width) / 2;
        } else {
          drawH = canvas.width / vRatio;
          offsetY = -(drawH - canvas.height) / 2;
        }

        try {
          ctx.drawImage(videoEl, offsetX, offsetY, drawW, drawH);
        } catch (e) {}

        // Draw studio-grade branded overlays on top matching Share Card design
        renderBrandedVideoOverlays(ctx, canvas.width, canvas.height, video, place, logoImg, yoouzLogoImg, authorAvatarImg);
      };

      const renderLoop = () => {
        if (isCancelled || !videoEl) return;
        
        if (videoEl.ended || (videoEl.paused && videoEl.currentTime >= duration - 0.15)) {
          return;
        }

        drawCurrentFrame();

        // Update progress
        const currentPct = 25 + Math.round((videoEl.currentTime / duration) * 65);
        onProgress?.({
          status: 'rendering',
          progress: Math.min(94, currentPct),
          message: `Rendering Ultra-HD frames (${Math.max(1, Math.round(videoEl.currentTime))}s / ${Math.round(duration)}s)...`,
        });

        animFrameId = requestAnimationFrame(renderLoop);
      };

      const completionPromise = new Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }>(
        (resolve) => {
          mediaRecorder.onstop = () => {
            cleanup();

            onProgress?.({
              status: 'encoding',
              progress: 96,
              message: 'Finalizing Ultra-HD video package...',
            });

            const finalMime = chosenMime.includes('mp4') ? 'video/mp4' : 'video/webm';
            const extension = chosenMime.includes('mp4') ? 'mp4' : 'webm';
            const finalBlob = new Blob(recordedChunks, { type: finalMime });
            const blobUrl = URL.createObjectURL(finalBlob);

            const safePlace = (place?.name || video.placeName || 'venue')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-');
            const safeAuthor = (video.author?.name || 'review')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-');
            const filename = `yoouz-branded-ad-${safePlace}-${safeAuthor}.${extension}`;

            // Trigger automatic file download
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            onProgress?.({
              status: 'completed',
              progress: 100,
              message: 'Ultra-HD Branded Video Ready! File downloaded.',
              blobUrl,
              filename,
            });

            resolve({ success: true, blobUrl, filename });
          };
        }
      );

      // Start recorder and playback
      mediaRecorder.start(100);
      videoEl.currentTime = 0;
      try {
        await videoEl.play();
      } catch (playErr) {
        console.warn('Unmuted playback failed, continuing with muted stream:', playErr);
        videoEl.muted = true;
        await videoEl.play();
      }
      renderLoop();

      const maxTimeout = (duration + 3) * 1000;
      const safetyTimer = setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, maxTimeout);

      videoEl.onended = () => {
        clearTimeout(safetyTimer);
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 200);
      };

      return await completionPromise;
  } catch (err: any) {
    console.error('Failed to export branded video:', err);
    cleanup();
    const errorMsg = err?.message || 'An error occurred during branded video export';
    onProgress?.({
      status: 'error',
      progress: 0,
      message: errorMsg,
      error: errorMsg,
    });
    return { success: false, error: errorMsg };
  }
}
