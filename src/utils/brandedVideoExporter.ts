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
  // Scale metrics relative to 1080p canvas baseline (so 4K 2160p scales up proportionally with retina sharpness)
  const scale = width / 1080;
  const safeScale = Math.max(scale, 0.75);

  const placeName = place?.name || video.placeName || 'Yoouz';
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
  // 1. TOP-LEFT BUSINESS HEADER PILL (Studio Dark Mode - Exact Website Match)
  // -------------------------------------------------------------
  const pillMarginX = 28 * safeScale;
  const pillMarginY = 28 * safeScale; // Top-anchored, perfectly spaced
  const pillHeight = 58 * safeScale;

  // Measure text for pill width
  ctx.font = `900 ${18 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  const nameWidth = ctx.measureText(placeName).width;
  const pillWidth = Math.max(250 * safeScale, nameWidth + 120 * safeScale);

  // Top Pill Background (Translucent dark glass matching website backdrop-blur-xl)
  drawRoundedRect(
    ctx,
    pillMarginX,
    pillMarginY,
    pillWidth,
    pillHeight,
    pillHeight / 2,
    'rgba(9, 9, 11, 0.88)',
    'rgba(255, 255, 255, 0.22)',
    1.4 * safeScale
  );

  // Logo box (Squircle matching website)
  const logoSize = 42 * safeScale;
  const logoX = pillMarginX + 8 * safeScale;
  const logoY = pillMarginY + (pillHeight - logoSize) / 2;

  if (isYoouz) {
    drawYoouzDarkIcon(ctx, logoX, logoY, logoSize, yoouzLogoImage);
  } else if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
    ctx.save();
    const logoRadius = logoSize * 0.28;
    drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, logoRadius, '#09090b', 'rgba(255, 255, 255, 0.25)', 1.2 * safeScale);
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
  const textStartX = logoX + logoSize + 11 * safeScale;
  const nameY = pillMarginY + 23 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 6 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 ${17 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillText(placeName, textStartX, nameY);

  // Checkmark next to name
  const badgeX = textStartX + ctx.measureText(placeName).width + 9 * safeScale;
  drawVerifiedBadge(ctx, badgeX, nameY - 5 * safeScale, 7 * safeScale);

  // Subtitle: ⭐ 5.0 (1 review)
  const subY = pillMarginY + 44 * safeScale;
  drawStar(ctx, textStartX + 6 * safeScale, subY - 4 * safeScale, 5, 5.5 * safeScale, 2.8 * safeScale, '#FBBF24');

  ctx.font = `800 ${13 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FBBF24';
  ctx.fillText(ratingScore, textStartX + 15 * safeScale, subY);

  ctx.font = `600 ${11.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(212, 212, 216, 0.9)';
  ctx.fillText(`(${reviewsCount} ${reviewsCount === 1 ? 'review' : 'reviews'})`, textStartX + 42 * safeScale, subY);

  // -------------------------------------------------------------
  // 2. BOTTOM REVIEW DETAILS & CREATOR INFO (Anchored precisely to bottom edge)
  // -------------------------------------------------------------
  const bottomMarginX = 28 * safeScale;
  
  const line3CaptionY = height - 26 * safeScale;
  const line2StarsY = height - 54 * safeScale;
  const line1AuthorY = height - 84 * safeScale;

  ctx.shadowColor = 'rgba(0, 0, 0, 0.98)';
  ctx.shadowBlur = 8 * safeScale;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1.5;

  // Author Row: By Author Name + Verified
  ctx.font = `900 ${24 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  const byText = `By ${authorName}`;
  ctx.fillText(byText, bottomMarginX, line1AuthorY);

  const byTextWidth = ctx.measureText(byText).width;
  drawVerifiedBadge(ctx, bottomMarginX + byTextWidth + 13 * safeScale, line1AuthorY - 8 * safeScale, 9 * safeScale);

  // Star Rating & Date Row
  const starRadius = 8 * safeScale;
  const starGap = 19 * safeScale;
  const numRating = Math.round(rawRating) || 5;

  for (let i = 0; i < 5; i++) {
    const starFill = i < numRating ? '#FBBF24' : 'rgba(113, 113, 122, 0.6)';
    drawStar(ctx, bottomMarginX + (i * starGap) + starRadius, line2StarsY - 4 * safeScale, 5, starRadius, starRadius * 0.5, starFill);
  }

  // Date timestamp
  ctx.font = `700 ${14 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(`🕒 ${recordedDateStr || '2 days ago'}`, bottomMarginX + (5 * starGap) + 12 * safeScale, line2StarsY);

  // Caption / Domain info
  let captionText = video.caption ? video.caption.trim() : `Video review for ${placeName.toLowerCase() === 'yoouz' ? 'yoouz.com' : placeName}`;
  if (!captionText || captionText.length === 0) {
    captionText = `Video review for ${placeName.toLowerCase() === 'yoouz' ? 'yoouz.com' : placeName}`;
  }
  ctx.font = `600 ${15 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(captionText, bottomMarginX, line3CaptionY);

  // -------------------------------------------------------------
  // 3. POWERED BY YOOUZ.COM WATERMARK BADGE (Studio Dark Mode)
  // -------------------------------------------------------------
  const watermarkWidth = 236 * safeScale;
  const watermarkHeight = 42 * safeScale;
  const watermarkX = width - watermarkWidth - 24 * safeScale;
  const watermarkY = height - watermarkHeight - 24 * safeScale;

  // Watermark Background (Deep dark glass with crisp border)
  drawRoundedRect(
    ctx,
    watermarkX,
    watermarkY,
    watermarkWidth,
    watermarkHeight,
    watermarkHeight / 2,
    'rgba(9, 9, 11, 0.92)',
    'rgba(255, 255, 255, 0.22)',
    1.4 * safeScale
  );

  // Official Dark Mode Yoouz Icon badge (Dark squircle with crisp WHITE star)
  const wmIconSize = 28 * safeScale;
  const wmIconX = watermarkX + 7 * safeScale;
  const wmIconY = watermarkY + (watermarkHeight - wmIconSize) / 2;
  drawYoouzDarkIcon(ctx, wmIconX, wmIconY, wmIconSize, yoouzLogoImage);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4 * safeScale;

  // "Powered by" text in crisp semi-translucent white
  ctx.font = `700 ${13.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('Powered by', watermarkX + 43 * safeScale, watermarkY + 26 * safeScale);

  // "yoouz.com" in pure bold white (NOT green!)
  ctx.font = `900 ${13.5 * safeScale}px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('yoouz.com', watermarkX + 128 * safeScale, watermarkY + 26 * safeScale);

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

    // 4. Supersample to Master 4K Ultra-HD vertical format (2160x3840) for extreme text & vector sharpness
    let targetWidth = 2160;
    let targetHeight = 3840;

    // Scale canvas dimensions if aspect ratio differs from standard 9:16
    const nativeAspect = naturalWidth / naturalHeight;
    if (Math.abs(nativeAspect - (9 / 16)) > 0.05) {
      targetWidth = 2160;
      targetHeight = Math.round(2160 / nativeAspect);
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

    // 6. Capture MediaStream from Canvas + Audio Tracks (60fps)
    const canvasStream = canvas.captureStream(60);
    if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
      audioDestination.stream.getAudioTracks().forEach((track) => {
        canvasStream.addTrack(track);
      });
    }

    // 7. Initialize MediaRecorder with Studio-Quality High Bitrate (60 Mbps)
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
      chosenMime ? { mimeType: chosenMime, videoBitsPerSecond: 60000000 } : undefined
    );

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    onProgress?.({
      status: 'rendering',
      progress: 25,
      message: 'Encoding Master 4K Ultra-HD frames with studio branding...',
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

      // Draw studio-grade branded overlays on top with official vector assets
      renderBrandedVideoOverlays(ctx, canvas.width, canvas.height, video, place, logoImg, yoouzLogoImg);

      // Update progress
      const currentPct = 25 + Math.round((videoEl.currentTime / duration) * 65);
      onProgress?.({
        status: 'rendering',
        progress: Math.min(92, currentPct),
        message: `Rendering Master 4K Ultra-HD (${Math.round(videoEl.currentTime)}s / ${Math.round(duration)}s)...`,
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
