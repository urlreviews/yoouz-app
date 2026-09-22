import { useState, useEffect, useMemo } from 'react';
import { getProxiedImageUrl } from '../utils/logoUtils';

export function useCriticalImagesLoaded(urls: (string | undefined | null)[], timeoutMs = 1500) {
  const [loaded, setLoaded] = useState(false);
  const cacheKey = useMemo(() => urls.join(','), [urls]);

  useEffect(() => {
    setLoaded(false); // Reset on URL change
    const validUrls = urls.filter(url => typeof url === 'string' && url.trim().length > 0) as string[];
    
    if (validUrls.length === 0) {
      setLoaded(true);
      return;
    }

    let loadedCount = 0;
    let hasTriggered = false;

    const trigger = () => {
      if (!hasTriggered) {
        hasTriggered = true;
        setLoaded(true);
      }
    };

    const timer = setTimeout(trigger, timeoutMs);

    validUrls.forEach(rawUrl => {
      const proxied = getProxiedImageUrl(rawUrl);
      if (!proxied) {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.src = proxied;
    });

    return () => clearTimeout(timer);
  }, [cacheKey, timeoutMs]);

  return loaded;
}
