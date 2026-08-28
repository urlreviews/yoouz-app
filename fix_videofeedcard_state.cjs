const fs = require('fs');
let code = fs.readFileSync('src/components/VideoFeedCard.tsx', 'utf-8');

const target = `  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);`;

const replace = `  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [browserForcedMute, setBrowserForcedMute] = useState<boolean>(false);`;

code = code.replace(target, replace);
fs.writeFileSync('src/components/VideoFeedCard.tsx', code, 'utf-8');
console.log("Fixed state");
