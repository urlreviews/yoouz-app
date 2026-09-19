import { VideoReview, Place } from '../types';
import { normalizeVideoUrl } from './videoUtils';
import { formatRecordedDate } from './dateUtils';
import { getVideoBlobFromIndexedDB } from '../lib/videoStorage';

export interface BrandedExportProgress {
  status: 'initializing' | 'loading' | 'rendering' | 'encoding' | 'completed' | 'error';
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
  size: number
) {
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

  // Crisp pure white star in the center
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
 * Helper to draw a verified checkmark badge
 */
function drawVerifiedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number = 10) {
  ctx.save();
  // White circle
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.closePath();

  // Dark checkmark
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.45, y);
  ctx.lineTo(x - radius * 0.1, y + radius * 0.4);
  ctx.lineTo(x + radius * 0.45, y - radius * 0.35);
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = radius * 0.35;
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
  logoImage?: HTMLImageElement | null
) {
  // Scale metrics relative to 1080p canvas baseline (so 4K / 2K scales up proportionally)
  const scale = width / 1080;
  const safeScale = Math.max(scale, 0.75);

  const placeName = place?.name || video.placeName || 'Yoouz Verified';
  const isYoouz = placeName.toLowerCase().includes('yoouz');
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const ratingScore = rawRating.toFixed(1);
  const reviewsCount = (video as any).reviewsCount || 1;
  const authorName = video.author?.name || 'Verified Customer';
  const recordedDateStr = formatRecordedDate(video.recordedAt, video.createdAtMs);

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // -------------------------------------------------------------
  // 1. TOP-LEFT BUSINESS HEADER PILL (Studio Dark Mode)
  // -------------------------------------------------------------
  const pillMarginX = 40 * safeScale;
  const pillMarginY = 64 * safeScale;
  const pillHeight = 72 * safeScale;

  // Measure text for pill width
  ctx.font = `900 ${22 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const nameWidth = ctx.measureText(placeName).width;
  const pillWidth = Math.max(280 * safeScale, nameWidth + 150 * safeScale);

  // Top Pill Background (Deep glass effect with high-contrast subtle border)
  drawRoundedRect(
    ctx,
    pillMarginX,
    pillMarginY,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    'rgba(9, 9, 11, 0.82)',
    'rgba(255, 255, 255, 0.22)',
    1.5 * safeScale
  );

  // Logo box
  const logoSize = 50 * safeScale;
  const logoX = pillMarginX + 11 * safeScale;
  const logoY = pillMarginY + (pillHeight - logoSize) / 2;

  if (isYoouz) {
    drawYoouzDarkIcon(ctx, logoX, logoY, logoSize);
  } else if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Outer ring for logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2 * safeScale;
    ctx.stroke();
    ctx.restore();
  } else {
    // Default high-end dark badge with star
    drawYoouzDarkIcon(ctx, logoX, logoY, logoSize);
  }

  // Business Name + Checkmark
  const textStartX = logoX + logoSize + 14 * safeScale;
  const nameY = pillMarginY + 29 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 6 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${20 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(placeName, textStartX, nameY);

  // Checkmark next to name
  const badgeX = textStartX + ctx.measureText(placeName).width + 12 * safeScale;
  drawVerifiedBadge(ctx, badgeX, nameY - 7 * safeScale, 8.5 * safeScale);

  // Subtitle: ⭐ 5.0 (1 reviews)
  const subY = pillMarginY + 54 * safeScale;
  drawStar(ctx, textStartX + 7 * safeScale, subY - 5 * safeScale, 5, 7 * safeScale, 3.5 * safeScale, '#FBBF24');

  ctx.font = `800 ${15 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FBBF24';
  ctx.fillText(ratingScore, textStartX + 18 * safeScale, subY);

  ctx.font = `500 ${13 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(244, 244, 245, 0.9)';
  ctx.fillText(`(${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'})`, textStartX + 48 * safeScale, subY);

  // -------------------------------------------------------------
  // 2. BOTTOM REVIEW DETAILS & CREATOR INFO
  // -------------------------------------------------------------
  const bottomMarginX = 40 * safeScale;
  const bottomBaseY = height - 190 * safeScale;

  // Author Row: By Author Name + Verified
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 10 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.font = `900 ${28 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const byText = `By ${authorName}`;
  ctx.fillText(byText, bottomMarginX, bottomBaseY);

  const byTextWidth = ctx.measureText(byText).width;
  drawVerifiedBadge(ctx, bottomMarginX + byTextWidth + 16 * safeScale, bottomBaseY - 10 * safeScale, 10.5 * safeScale);

  // Star Rating & Date Row
  const starsY = bottomBaseY + 36 * safeScale;
  const starRadius = 9.5 * safeScale;
  const starGap = 23 * safeScale;
  const numRating = Math.round(rawRating) || 5;

  for (let i = 0; i < 5; i++) {
    const starFill = i < numRating ? '#FBBF24' : 'rgba(113, 113, 122, 0.6)';
    drawStar(ctx, bottomMarginX + (i * starGap) + starRadius, starsY, 5, starRadius, starRadius * 0.5, starFill);
  }

  // Date timestamp
  ctx.font = `700 ${16 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(`🕒 ${recordedDateStr || 'Verified Review'}`, bottomMarginX + (5 * starGap) + 16 * safeScale, starsY + 5 * safeScale);

  // Caption / Domain info
  const captionY = starsY + 38 * safeScale;
  let captionText = video.caption ? video.caption.trim() : `Video review for ${placeName}`;
  if (!captionText || captionText.length === 0) {
    captionText = `Video review for ${placeName}`;
  }
  ctx.font = `600 ${18 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(captionText, bottomMarginX, captionY);

  // -------------------------------------------------------------
  // 3. POWERED BY YOOUZ.COM WATERMARK BADGE (Studio Dark Mode)
  // -------------------------------------------------------------
  const watermarkWidth = 260 * safeScale;
  const watermarkHeight = 50 * safeScale;
  const watermarkX = width - watermarkWidth - 40 * safeScale;
  const watermarkY = height - watermarkHeight - 56 * safeScale;

  // Watermark Background (Deep dark glass with clean border)
  drawRoundedRect(
    ctx,
    watermarkX,
    watermarkY,
    watermarkWidth,
    watermarkHeight,
    watermarkHeight / 2,
    'rgba(9, 9, 11, 0.88)',
    'rgba(255, 255, 255, 0.22)',
    1.4 * safeScale
  );

  // Official Dark Mode Yoouz Icon badge (Dark square with crisp WHITE star)
  const wmIconSize = 34 * safeScale;
  const wmIconX = watermarkX + 9 * safeScale;
  const wmIconY = watermarkY + (watermarkHeight - wmIconSize) / 2;
  drawYoouzDarkIcon(ctx, wmIconX, wmIconY, wmIconSize);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4 * safeScale;

  // "Powered by" text in crisp semi-translucent white
  ctx.font = `700 ${15 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Powered by', watermarkX + 52 * safeScale, watermarkY + 31 * safeScale);

  // "yoouz.com" in pure bold white (NOT green!)
  ctx.font = `900 ${15 * safeScale}px -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('yoouz.com', watermarkX + 144 * safeScale, watermarkY + 31 * safeScale);

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
export async function exportBrandedAdVideo(
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string },
  onProgress?: (progress: BrandedExportProgress) => void
): Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }> {
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

    // 2. Preload Logo Image for Canvas
    onProgress?.({
      status: 'loading',
      progress: 15,
      message: 'Loading high-resolution venue branding...',
    });

    const logoUrl = place?.logoUrl || video.placeLogoUrl;
    const logoImg = await loadCanvasImage(logoUrl);

    // 3. Create Offscreen Video Element
    const videoEl = document.createElement('video');
    videoEl.crossOrigin = 'anonymous';
    videoEl.src = videoSrc;
    videoEl.muted = false;
    videoEl.playsInline = true;
    videoEl.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      videoEl.onloadedmetadata = () => resolve();
      videoEl.onerror = () => reject(new Error('Failed to load video element metadata'));
      setTimeout(() => reject(new Error('Video loading timed out')), 15000);
    });

    const naturalWidth = videoEl.videoWidth || 1080;
    const naturalHeight = videoEl.videoHeight || 1920;
    const duration = videoEl.duration || 5;

    // 4. Supersample to high-resolution vertical format (Minimum 1080x1920 FHD, up to 4K UHD 2160x3840)
    let targetWidth = 1080;
    let targetHeight = 1920;

    if (naturalWidth >= 1440 || naturalHeight >= 2560) {
      // 4K UHD vertical supersampling
      targetWidth = 2160;
      targetHeight = 3840;
    } else if (naturalWidth > 1080) {
      targetWidth = naturalWidth;
      targetHeight = Math.round((naturalWidth * 16) / 9);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create Canvas 2D context');

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 5. Setup AudioContext and Audio Stream Routing
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    let audioDestination: MediaStreamAudioDestinationNode | null = null;
    let audioContext: AudioContext | null = null;

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

    // 6. Capture MediaStream from Canvas + Audio Tracks (60fps or 30fps)
    const canvasStream = canvas.captureStream(60);
    if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
      audioDestination.stream.getAudioTracks().forEach((track) => {
        canvasStream.addTrack(track);
      });
    }

    // 7. Initialize MediaRecorder with Studio-Quality High Bitrate (30-40 Mbps)
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
      chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 35000000 } : undefined
    );

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    onProgress?.({
      status: 'rendering',
      progress: 25,
      message: 'Encoding Ultra-HD frames with dark mode branding...',
    });

    // 8. High-Fidelity Playback & Draw Loop
    let isCancelled = false;
    let animFrameId: number;

    const renderLoop = () => {
      if (isCancelled || videoEl.ended || (videoEl.paused && videoEl.currentTime >= duration - 0.1)) {
        return;
      }

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

      ctx.drawImage(videoEl, offsetX, offsetY, drawW, drawH);

      // Draw studio-grade branded overlays on top
      renderBrandedVideoOverlays(ctx, canvas.width, canvas.height, video, place, logoImg);

      // Update progress
      const currentPct = 25 + Math.round((videoEl.currentTime / duration) * 65);
      onProgress?.({
        status: 'rendering',
        progress: Math.min(92, currentPct),
        message: `Rendering Ultra-HD frames (${Math.round(videoEl.currentTime)}s / ${Math.round(duration)}s)...`,
      });

      animFrameId = requestAnimationFrame(renderLoop);
    };

    const completionPromise = new Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }>(
      (resolve) => {
        mediaRecorder.onstop = () => {
          cancelAnimationFrame(animFrameId);
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

          // Cleanup AudioContext
          if (audioContext) {
            audioContext.close().catch(() => {});
          }

          resolve({ success: true, blobUrl, filename });
        };
      }
    );

    // Start recorder and playback
    mediaRecorder.start(100);
    videoEl.currentTime = 0;
    await videoEl.play();
    renderLoop();

    videoEl.onended = () => {
      setTimeout(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }, 200);
    };

    return await completionPromise;
  } catch (err: any) {
    console.error('Failed to export branded video:', err);
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
