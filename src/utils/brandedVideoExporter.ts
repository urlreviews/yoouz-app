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
 * Helper to draw a 5-point star on Canvas
 */
function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string
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
 * Renders the high-end branded overlays onto the canvas frame
 */
export function renderBrandedVideoOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  video: VideoReview,
  place?: Place | { name?: string; rating?: number; reviewsCount?: number; logoUrl?: string; website?: string },
  logoImage?: HTMLImageElement | null
) {
  // Scale metrics relative to 1080p canvas
  const scale = Math.min(width, height) / 1080;
  const safeScale = Math.max(scale, 0.65);

  const placeName = place?.name || video.placeName || 'Yoouz Verified';
  const rawRating = typeof video.rating === 'number' && !isNaN(video.rating) ? video.rating : (Number(video.rating) || 5.0);
  const ratingScore = rawRating.toFixed(1);
  const reviewsCount = (video as any).reviewsCount || 1;
  const authorName = video.author?.name || 'Verified Customer';
  const recordedDateStr = formatRecordedDate(video.recordedAt, video.createdAtMs);

  ctx.save();

  // -------------------------------------------------------------
  // 1. TOP-LEFT BUSINESS HEADER PILL (Exact match to Yoouz UI)
  // -------------------------------------------------------------
  const pillMarginX = 36 * safeScale;
  const pillMarginY = 56 * safeScale;
  const pillHeight = 64 * safeScale;
  const pillPaddingX = 14 * safeScale;

  // Measure text for pill width
  ctx.font = `900 ${20 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  const nameWidth = ctx.measureText(placeName).width;
  const pillWidth = Math.max(260 * safeScale, nameWidth + 140 * safeScale);

  // Top Pill Background (Deep glass effect with border)
  drawRoundedRect(
    ctx,
    pillMarginX,
    pillMarginY,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    'rgba(9, 9, 11, 0.78)',
    'rgba(255, 255, 255, 0.22)',
    1.5 * safeScale
  );

  // Logo box
  const logoSize = 44 * safeScale;
  const logoX = pillMarginX + 10 * safeScale;
  const logoY = pillMarginY + (pillHeight - logoSize) / 2;

  if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } else {
    // Monogram or star badge
    drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, logoSize / 2, '#18181b', 'rgba(255,255,255,0.2)', 1);
    drawStar(ctx, logoX + logoSize / 2, logoY + logoSize / 2, 5, 11 * safeScale, 5.5 * safeScale, '#FBBF24');
  }

  // Business Name + Checkmark
  const textStartX = logoX + logoSize + 12 * safeScale;
  const nameY = pillMarginY + 26 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${18 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(placeName, textStartX, nameY);

  // Checkmark next to name
  const badgeX = textStartX + ctx.measureText(placeName).width + 12 * safeScale;
  drawVerifiedBadge(ctx, badgeX, nameY - 6 * safeScale, 7.5 * safeScale);

  // Subtitle: ⭐ 5.0 (1 reviews)
  const subY = pillMarginY + 47 * safeScale;
  drawStar(ctx, textStartX + 6 * safeScale, subY - 4 * safeScale, 5, 6 * safeScale, 3 * safeScale, '#FBBF24');

  ctx.font = `800 ${13 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FBBF24';
  ctx.fillText(ratingScore, textStartX + 16 * safeScale, subY);

  ctx.font = `500 ${12 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(228, 228, 231, 0.9)';
  ctx.fillText(`(${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'})`, textStartX + 42 * safeScale, subY);

  // -------------------------------------------------------------
  // 2. BOTTOM REVIEW DETAILS & CREATOR INFO
  // -------------------------------------------------------------
  const bottomMarginX = 36 * safeScale;
  const bottomBaseY = height - 170 * safeScale;

  // Author Row: By Author Name + Verified
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 8 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 2;

  ctx.font = `900 ${24 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const byText = `By ${authorName}`;
  ctx.fillText(byText, bottomMarginX, bottomBaseY);

  const byTextWidth = ctx.measureText(byText).width;
  drawVerifiedBadge(ctx, bottomMarginX + byTextWidth + 14 * safeScale, bottomBaseY - 8 * safeScale, 9 * safeScale);

  // Star Rating & Date Row
  const starsY = bottomBaseY + 30 * safeScale;
  const starRadius = 8.5 * safeScale;
  const starGap = 20 * safeScale;
  const numRating = Math.round(rawRating) || 5;

  for (let i = 0; i < 5; i++) {
    const starFill = i < numRating ? '#FBBF24' : 'rgba(113, 113, 122, 0.6)';
    drawStar(ctx, bottomMarginX + (i * starGap) + starRadius, starsY, 5, starRadius, starRadius * 0.5, starFill);
  }

  // Date timestamp
  ctx.font = `700 ${14 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(244, 244, 245, 0.95)';
  ctx.fillText(`🕒 ${recordedDateStr || 'Verified Review'}`, bottomMarginX + (5 * starGap) + 14 * safeScale, starsY + 4 * safeScale);

  // Caption / Domain info
  const captionY = starsY + 32 * safeScale;
  let captionText = video.caption ? video.caption.trim() : `Video review for ${placeName}`;
  if (!captionText || captionText.length === 0) {
    captionText = `Video review for ${placeName}`;
  }
  ctx.font = `600 ${16 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(captionText, bottomMarginX, captionY);

  // -------------------------------------------------------------
  // 3. POWERED BY YOOUZ.COM WATERMARK BADGE (Bottom Right or Bottom Center)
  // -------------------------------------------------------------
  const watermarkWidth = 240 * safeScale;
  const watermarkHeight = 44 * safeScale;
  const watermarkX = width - watermarkWidth - 36 * safeScale;
  const watermarkY = height - watermarkHeight - 48 * safeScale;

  drawRoundedRect(
    ctx,
    watermarkX,
    watermarkY,
    watermarkWidth,
    watermarkHeight,
    watermarkHeight / 2,
    'rgba(9, 9, 11, 0.85)',
    'rgba(255, 255, 255, 0.2)',
    1.2 * safeScale
  );

  // Star icon in watermark
  drawStar(ctx, watermarkX + 22 * safeScale, watermarkY + watermarkHeight / 2, 5, 8 * safeScale, 4 * safeScale, '#FBBF24');

  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4 * safeScale;
  ctx.font = `800 ${14 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Powered by', watermarkX + 38 * safeScale, watermarkY + 27 * safeScale);

  ctx.font = `900 ${14 * safeScale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#10B981'; // Yoouz emerald green
  ctx.fillText('yoouz.com', watermarkX + 130 * safeScale, watermarkY + 27 * safeScale);

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
 * Encodes and downloads a complete branded MP4/WebM video review with baked-in overlays and audio.
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
      message: 'Preparing video elements and audio stream...',
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
      message: 'Loading venue branding and badges...',
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

    const videoWidth = videoEl.videoWidth || 720;
    const videoHeight = videoEl.videoHeight || 1280;
    const duration = videoEl.duration || 5;

    // 4. Create Canvas matching video aspect ratio (High Resolution)
    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create Canvas 2D context');

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
        // Connect to destination but keep local output quiet or allow monitor
      } catch (audioErr) {
        console.warn('AudioContext setup error (video may export without audio):', audioErr);
      }
    }

    // 6. Capture MediaStream from Canvas + Audio Tracks
    const canvasStream = canvas.captureStream(30);
    if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
      audioDestination.stream.getAudioTracks().forEach((track) => {
        canvasStream.addTrack(track);
      });
    }

    // 7. Initialize MediaRecorder with best supported mimeType
    const mimeTypes = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
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
      chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 6000000 } : undefined
    );

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    onProgress?.({
      status: 'rendering',
      progress: 25,
      message: 'Burning venue branding and verified badges onto video...',
    });

    // 8. Playback & Draw Loop
    let isCancelled = false;
    let animFrameId: number;

    const renderLoop = () => {
      if (isCancelled || videoEl.ended || videoEl.paused && videoEl.currentTime >= duration - 0.1) {
        return;
      }

      // Draw video frame
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

      // Draw branded overlays on top
      renderBrandedVideoOverlays(ctx, canvas.width, canvas.height, video, place, logoImg);

      // Update progress
      const currentPct = 25 + Math.round((videoEl.currentTime / duration) * 65);
      onProgress?.({
        status: 'rendering',
        progress: Math.min(92, currentPct),
        message: `Rendering frames (${Math.round(videoEl.currentTime)}s / ${Math.round(duration)}s)...`,
      });

      animFrameId = requestAnimationFrame(renderLoop);
    };

    const completionPromise = new Promise<{ success: boolean; blobUrl?: string; filename?: string; error?: string }>(
      (resolve) => {
        mediaRecorder.onstop = () => {
          cancelAnimationFrame(animFrameId);
          onProgress?.({
            status: 'encoding',
            progress: 95,
            message: 'Finalizing branded ad video package...',
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
            message: 'Branded Video Ready! File downloaded.',
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
