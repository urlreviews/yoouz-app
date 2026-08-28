const fs = require('fs');
let code = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

const target = `<video
                ref={videoRef}
                src={activeSourceUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onError={handleVideoError}
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />`;

const replacement = `<video
                ref={videoRef}
                src={activeSourceUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                preload="auto"
                onError={handleVideoError}
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />
              {/* Invisible preloader for the NEXT video in the feed to make swiping instant */}
              {currentIndex < videos.length - 1 && videos[currentIndex + 1]?.videoUrl && (
                <video
                  src={videos[currentIndex + 1].videoUrl}
                  preload="auto"
                  className="hidden"
                  muted
                  playsInline
                />
              )}`;

code = code.replace(target, replacement);
fs.writeFileSync('src/components/CopoVideoPlayer.tsx', code);
