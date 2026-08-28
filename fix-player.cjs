const fs = require('fs');
let code = fs.readFileSync('src/components/CopoVideoPlayer.tsx', 'utf8');

const target = `<YouTube
                videoId={currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be') ? 
                  currentVideo.videoUrl.split('v=')[1]?.substring(0, 11) || 'dQw4w9WgXcQ' : 
                  'dQw4w9WgXcQ'
                }
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                    mute: isMuted ? 1 : 0,
                    loop: 1,
                    playlist: currentVideo.videoUrl.includes('youtube.com') || currentVideo.videoUrl.includes('youtu.be') ? 
                      currentVideo.videoUrl.split('v=')[1]?.substring(0, 11) || 'dQw4w9WgXcQ' : 
                      'dQw4w9WgXcQ'
                  }
                }}
                onReady={(e) => {
                  if (isPlaying) {
                    e.target.playVideo();
                  } else {
                    e.target.pauseVideo();
                  }
                }}
                onStateChange={(e) => {
                  if (e.data === 1) {
                    setHasMediaError(false);
                  }
                }}
                onError={handleVideoError}
                className="w-full h-[150%] -top-[25%] absolute" // Hack to hide youtube letterboxing
                iframeClassName="w-full h-full object-cover"
              />`;

const replacement = `<video
                ref={videoRef}
                src={activeSourceUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                onError={handleVideoError}
                className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
              />`;

code = code.replace(target, replacement);

// Ensure the import is removed
code = code.replace(/import YouTube from 'react-youtube';/g, '');

fs.writeFileSync('src/components/CopoVideoPlayer.tsx', code);
