/**
 * Helper to trigger direct browser file download for the official Yoouz Brand Banner
 */
export async function downloadYoouzBanner(format: 'svg' | 'png' = 'svg') {
  try {
    const response = await fetch('/yoouz-brand-banner.svg');
    if (!response.ok) {
      throw new Error(`Failed to fetch banner asset: ${response.statusText}`);
    }
    const svgText = await response.text();

    if (format === 'svg') {
      const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yoouz-brand-banner.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    // Convert SVG to PNG via HTML Canvas for high-res desktop download
    const img = new Image();
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 1920, 1080);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'yoouz-brand-banner.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
          }
        }, 'image/png', 1.0);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      // Fallback to SVG if canvas conversion is blocked by browser security
      const link = document.createElement('a');
      link.href = url;
      link.download = 'yoouz-brand-banner.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = url;
  } catch (err) {
    console.error('Error downloading Yoouz brand banner:', err);
    // Direct link fallback
    window.open('/yoouz-brand-banner.svg', '_blank');
  }
}
