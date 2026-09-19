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
 */
export function renderBrandedVideoOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string },
  logoImage?: HTMLImageElement | null,
  yoouzLogoImage?: HTMLImageElement | null
) {
  // Scale metrics relative to 440px mobile baseline for exact layout parity
  const safeScale = width / 440;

  const rawPlaceName = place?.name || video.placeName || 'Yoouz';
  let placeName = rawPlaceName.trim();
  if (placeName.toLowerCase() === 'yoouz' || placeName.toLowerCase() === 'yoouz.com') {
    placeName = 'Yoouz';
  }

  const isYoouz = placeName.toLowerCase().includes('yoouz');
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const ratingScore = rawRating.toFixed(1);
  
  // Review count for the venue (strictly from venue data, never falling back to video comments count)
  let reviewsCount = 1;
  if (typeof (place as any)?.reviewsCount === 'number' && (place as any).reviewsCount > 0) {
    reviewsCount = (place as any).reviewsCount;
  } else if (typeof (place as any)?.reviewCount === 'number' && (place as any).reviewCount > 0) {
    reviewsCount = (place as any).reviewCount;
  } else if (typeof (video as any).reviewsCount === 'number' && (video as any).reviewsCount > 0) {
    reviewsCount = (video as any).reviewsCount;
  }

  const authorName = video.author?.name || 'Verified Reviewer';

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // -------------------------------------------------------------
  // 1. TOP-LEFT BUSINESS HEADER PILL (Elevated Safe Zone for Mobile & Desktop)
  // -------------------------------------------------------------
  // Positioned safely below phone status bar, Dynamic Island, time indicator, and platform back buttons
  const pillMarginX = 20 * safeScale;
  const pillMarginY = 58 * safeScale; // Placed in the verified social video top safe zone
  const pillHeight = 36 * safeScale;

  // Measure text for pill width
  ctx.font = `700 ${12.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const nameWidth = ctx.measureText(placeName).width;
  const pillWidth = Math.max(160 * safeScale, nameWidth + 88 * safeScale);

  // Top Pill Background (Translucent dark glass matching in-app backdrop-blur-xl)
  drawRoundedRect(
    ctx,
    pillMarginX,
    pillMarginY,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    'rgba(0, 0, 0, 0.75)',
    'rgba(255, 255, 255, 0.22)',
    1.2 * safeScale
  );

  // Logo box (Squircle matching website)
  const logoSize = 26 * safeScale;
  const logoX = pillMarginX + 5 * safeScale;
  const logoY = pillMarginY + (pillHeight - logoSize) / 2;

  if (isYoouz) {
    drawYoouzDarkIcon(ctx, logoX, logoY, logoSize, yoouzLogoImage);
  } else if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    ctx.save();
    const logoRadius = logoSize * 0.28;
    drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, logoRadius, '#09090b', 'rgba(255, 255, 255, 0.25)', 1.0 * safeScale);
    ctx.beginPath();
    ctx.moveTo(logoX + logoRadius, logoY);
    ctx.lineTo(logoX + logoSize - logoRadius, logoY);
    ctx.quadraticCurveTo(logoX + logoSize, logoY, logoX + logoSize, logoY + logoRadius);
    ctx.lineTo(logoX + logoSize, logoY + logoSize - logoRadius);
    ctx.quadraticCurveTo(logoX + logoSize, logoY + logoSize, logoX + logoSize - logoRadius, logoY + logoSize);
    ctx.lineTo(logoX + logoRadius, logoY + logoSize);
    ctx.quadraticCurveTo(logoX, logoY + logoSize, logoX, logoY + logoSize - logoRadius);
    ctx.lineTo(logoX, logoY + logoRadius);
    ctx.quadraticCurveTo(logoX, logoY, logoX + logoRadius, logoY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } else {
    drawYoouzDarkIcon(ctx, logoX, logoY, logoSize, yoouzLogoImage);
  }

  // Business Name + Checkmark
  const textStartX = logoX + logoSize + 8 * safeScale;
  const nameY = pillMarginY + 15 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `800 ${12 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(placeName, textStartX, nameY);

  // Checkmark next to name
  const badgeX = textStartX + ctx.measureText(placeName).width + 6 * safeScale;
  drawVerifiedBadge(ctx, badgeX, nameY - 4 * safeScale, 4.8 * safeScale);

  // Subtitle: ⭐ 5.0 (1 review)
  const subY = pillMarginY + 28 * safeScale;
  drawStar(ctx, textStartX + 4 * safeScale, subY - 3 * safeScale, 5, 4 * safeScale, 2 * safeScale, '#FBBF24');

  ctx.font = `800 ${9.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FBBF24';
  ctx.fillText(ratingScore, textStartX + 11 * safeScale, subY);

  ctx.font = `600 ${8.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(`(${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'})`, textStartX + 30 * safeScale, subY);

  // -------------------------------------------------------------
  // 2. BOTTOM-LEFT REVIEW DETAILS (Elevated Safe Zone: Above Facebook User & Comment UI)
  // -------------------------------------------------------------
  // Elevating by 138 safe scale units ensures zero obstruction by Facebook/Instagram/TikTok poster profile photo & comment bar
  const bottomMarginX = 20 * safeScale;
  const safeBottomOffset = 138 * safeScale;
  const line3CaptionY = height - safeBottomOffset;
  const line2StarsY = line3CaptionY - 19 * safeScale;
  const line1AuthorY = line2StarsY - 21 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
  ctx.shadowBlur = 6 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1.5;

  // Author Row: By Author Name + Verified
  ctx.font = `800 ${14.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const byText = `By ${authorName}`;
  ctx.fillText(byText, bottomMarginX, line1AuthorY);

  const byTextWidth = ctx.measureText(byText).width;
  drawVerifiedBadge(ctx, bottomMarginX + byTextWidth + 7 * safeScale, line1AuthorY - 4.5 * safeScale, 5 * safeScale);

  // Star Rating & Date Row
  const starRadius = 5.5 * safeScale;
  const starGap = 13.5 * safeScale;
  const numRating = Math.round(rawRating) || 5;

  for (let i = 0; i < 5; i++) {
    const starFill = i < numRating ? '#FBBF24' : 'rgba(113, 113, 122, 0.6)';
    drawStar(ctx, bottomMarginX + (i * starGap) + starRadius, line2StarsY - 3 * safeScale, 5, starRadius, starRadius * 0.5, starFill);
  }

  // Date timestamp with clean vector clock symbol matching the in-app player
  const recordedDateStr = formatRecordedDate(video.recordedAt, video.createdAtMs);
  if (recordedDateStr) {
    const clockRadius = 4.8 * safeScale;
    const clockX = bottomMarginX + (5 * starGap) + 12 * safeScale;
    const clockY = line2StarsY - 3.2 * safeScale;
    
    drawClockIcon(ctx, clockX, clockY, clockRadius, 'rgba(255, 255, 255, 0.88)');

    ctx.font = `700 ${10.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.fillText(recordedDateStr, clockX + clockRadius + 5 * safeScale, line2StarsY);
  }

  // Caption / Domain info
  let captionText = video.caption ? video.caption.trim() : `Video review for ${placeName.toLowerCase() === 'yoouz' ? 'yoouz.com' : placeName}`;
  if (!captionText || captionText.length === 0) {
    captionText = `Video review for ${placeName.toLowerCase() === 'yoouz' ? 'yoouz.com' : placeName}`;
  }
  ctx.font = `600 ${11 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(captionText, bottomMarginX, line3CaptionY);

  // -------------------------------------------------------------
  // 3. BOTTOM-RIGHT POWERED BY YOOUZ.COM TRUST BADGE (Elevated Safe Zone)
  // -------------------------------------------------------------
  const watermarkHeight = 28 * safeScale;
  const wmIconSize = 18 * safeScale;
  const wmMarginRight = 20 * safeScale;
  const watermarkY = height - safeBottomOffset - 2 * safeScale; // Aligned with the elevated safe zone

  // Measure text with exact natural font metrics for seamless typography
  ctx.font = `500 ${9.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  const prefixText = 'Powered by ';
  const prefixWidth = ctx.measureText(prefixText).width;

  ctx.font = `800 ${9.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const domainText = 'yoouz.com';
  const domainWidth = ctx.measureText(domainText).width;

  const innerTextWidth = prefixWidth + domainWidth;
  const watermarkWidth = wmIconSize + (14 * safeScale) + innerTextWidth + (12 * safeScale);
  const watermarkX = width - watermarkWidth - wmMarginRight;

  // Watermark Background (Deep dark glass with crisp border)
  drawRoundedRect(
    ctx,
    watermarkX,
    watermarkY,
    watermarkWidth,
    watermarkHeight,
    watermarkHeight / 2,
    'rgba(0, 0, 0, 0.75)',
    'rgba(255, 255, 255, 0.22)',
    1.1 * safeScale
  );

  // Official Dark Mode Yoouz Icon badge (Dark squircle with crisp WHITE star)
  const wmIconX = watermarkX + 5 * safeScale;
  const wmIconY = watermarkY + (watermarkHeight - wmIconSize) / 2;
  drawYoouzDarkIcon(ctx, wmIconX, wmIconY, wmIconSize, yoouzLogoImage);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  const wmTextStartX = wmIconX + wmIconSize + 6 * safeScale;
  const wmTextY = watermarkY + 17.5 * safeScale;

  // "Powered by " text in crisp semi-translucent white
  ctx.font = `500 ${9.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText(prefixText, wmTextStartX, wmTextY);

  // "yoouz.com" immediately contiguous in pure bold white
  ctx.font = `800 ${9.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(domainText, wmTextStartX + prefixWidth, wmTextY);

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
      const [logoImg, yoouzLogoImg] = await Promise.all([
        loadCanvasImage(logoUrl),
        loadCanvasImage('/yoouz-avatar-white.svg').then(img => img || loadCanvasImage('/yoouz-avatar-white.png'))
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

      // 4. Set canvas dimensions to 1080x1920 (standard 9:16 vertical video across mobile & desktop) for real-time 60fps hardware encoding
      const targetWidth = 1080;
      const targetHeight = 1920;

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

        // Draw studio-grade branded overlays on top with official vector assets
        renderBrandedVideoOverlays(ctx, canvas.width, canvas.height, video, place, logoImg, yoouzLogoImg);
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
