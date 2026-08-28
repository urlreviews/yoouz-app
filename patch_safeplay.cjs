const fs = require('fs');

let card = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

// Patch safePlay
card = card.replace(
  `        } catch {
          setIsPlaying(false);
          setIsBuffering(false);
        }
      } else {
        setIsPlaying(false);
        setIsBuffering(false);
      }`,
  `        } catch (e: any) {
          setIsPlaying(false);
          setIsBuffering(false);
          if (e.name !== "AbortError") setHasError(true);
        }
      } else {
        setIsPlaying(false);
        setIsBuffering(false);
        setHasError(true);
      }`
);

fs.writeFileSync('src/components/VideoFeedCard.tsx', card);
