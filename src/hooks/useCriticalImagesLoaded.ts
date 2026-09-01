import { useState, useEffect, useMemo } from 'react';

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

    validUrls.forEach(url => {
      const img = new window.Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === validUrls.length) trigger();
      };
      img.src = url;
    });

    return () => clearTimeout(timer);
  }, [cacheKey, timeoutMs]);

  return loaded;
}
