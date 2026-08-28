const fs = require('fs');
let code = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf-8');

const ioTarget = `  // IntersectionObserver: 0.7 visibility threshold for strict single-video playback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute("data-video-index");
            if (idxAttr !== null) {
              const idx = parseInt(idxAttr, 10);
              if (!isNaN(idx) && idx !== currentIndexRef.current) {
                currentIndexRef.current = idx;
                onSelectVideoIndex(idx);
              }
            }
          }
        });
      },`;

const ioReplace = `  // IntersectionObserver: 0.7 visibility threshold for strict single-video playback
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current) return; // Ignore during programmatic smooth scroll
        
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idxAttr = entry.target.getAttribute("data-video-index");
            if (idxAttr !== null) {
              const idx = parseInt(idxAttr, 10);
              if (!isNaN(idx) && idx !== currentIndexRef.current) {
                currentIndexRef.current = idx;
                onSelectVideoIndex(idx);
              }
            }
          }
        });
      },`;

code = code.replace(ioTarget, ioReplace);

const scrollEffectTarget = `  // Scroll to currentIndex when changed via keyboard or floating arrow buttons
  useEffect(() => {
    if (isProgrammaticScrollRef.current) {
      const cardEl = cardRefs.current[currentIndex];
      if (cardEl && containerRef.current) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      isProgrammaticScrollRef.current = false;
    }
  }, [currentIndex]);`;

const scrollEffectReplace = `  // Scroll to currentIndex when changed via keyboard or floating arrow buttons
  useEffect(() => {
    if (isProgrammaticScrollRef.current) {
      const cardEl = cardRefs.current[currentIndex];
      if (cardEl && containerRef.current) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      
      // Unlock programmatic scroll after the smooth scroll animation completes (~800ms)
      const timeout = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex]);`;

code = code.replace(scrollEffectTarget, scrollEffectReplace);

const handleNextPrevTarget = `  const handleNext = () => {
    isProgrammaticScrollRef.current = true;
    if (currentIndex < videos.length - 1) {
      onSelectVideoIndex(currentIndex + 1);
    } else {
      onSelectVideoIndex(0);
    }
  };

  const handlePrev = () => {
    isProgrammaticScrollRef.current = true;
    if (currentIndex > 0) {
      onSelectVideoIndex(currentIndex - 1);
    } else {
      onSelectVideoIndex(videos.length - 1);
    }
  };`;

const handleNextPrevReplace = `  const handleNext = () => {
    if (currentIndex < videos.length - 1) {
      isProgrammaticScrollRef.current = true;
      onSelectVideoIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      isProgrammaticScrollRef.current = true;
      onSelectVideoIndex(currentIndex - 1);
    }
  };`;

code = code.replace(handleNextPrevTarget, handleNextPrevReplace);

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', code, 'utf-8');
console.log("Fixed CopoVideoPlayer scroll bug");
