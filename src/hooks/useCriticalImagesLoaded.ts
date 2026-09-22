import { useState, useEffect, useMemo } from 'react';
import { getProxiedImageUrl, KNOWN_LOADED_BANNERS } from '../utils/logoUtils';

export function useCriticalImagesLoaded(urls: (string | undefined | null)[], timeoutMs = 1500) {
  const [loaded, setLoaded] = useState(false);
  const cacheKey = useMemo(() => urls.join(','), [urls]);

  useEffect(() => {
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

    validUrls.forEach(rawUrl => {
      const proxied = getProxiedImageUrl(rawUrl);
      if (!proxied || KNOWN_LOADED_BANNERS.has(proxied)) {
        loadedCount++;
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        KNOWN_LOADED_BANNERS.add(proxied);
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.src = proxied;
    });

    if (loadedCount === validUrls.length) {
      setLoaded(true);
      return;
    }

    const timer = setTimeout(trigger, timeoutMs);

    return () => clearTimeout(timer);
  }, [cacheKey, timeoutMs]);

  return loaded;
}
