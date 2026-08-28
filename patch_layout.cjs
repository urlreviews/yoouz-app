const fs = require('fs');
let card = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf8');

card = card.replace(
  '<div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">',
  '<!-- Center Overlays removed wrapper -->'
);

card = card.replace(
  '{/* Buffering Spinner */}',
  '{/* Buffering Spinner */}\n        {isActive && isBuffering && (\n          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-xl pointer-events-none">\n            <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />\n          </div>\n        )}'
);

card = card.replace(
  '{isActive && isBuffering && (',
  '<!-- old buffering -->'
);
card = card.replace(
  '<div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-xl">',
  '<!-- old buffering inner -->'
);
card = card.replace(
  '<Loader2 className="w-7 h-7 text-blue-400 animate-spin" />',
  '<!-- old buffering spinner -->'
);
card = card.replace(
  '</div>\n        )}',
  '<!-- old buffering close -->'
);

card = card.replace(
  'className="w-18 h-18 sm:w-20 sm:h-20 rounded-full',
  'className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-18 h-18 sm:w-20 sm:h-20 rounded-full'
);

card = card.replace(
  'className="animate-ping duration-700 pointer-events-none"',
  'className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-ping duration-700 pointer-events-none"'
);

card = card.replace(
  '        {/* Double-tap Heart Animation */}\n        {showHeartAnimation && (\n          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-ping duration-700 pointer-events-none">\n            <Heart className="w-24 h-24 fill-[#ff2d55] text-[#ff2d55] drop-shadow-2xl" />\n          </div>\n        )}\n      </div>',
  '        {/* Double-tap Heart Animation */}\n        {showHeartAnimation && (\n          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-ping duration-700 pointer-events-none">\n            <Heart className="w-24 h-24 fill-[#ff2d55] text-[#ff2d55] drop-shadow-2xl" />\n          </div>\n        )}'
);

fs.writeFileSync('src/components/VideoFeedCard.tsx', card);
