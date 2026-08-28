const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const replacement = `
        analyser.getByteTimeDomainData(dataArray);
        let maxDeviation = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const deviation = Math.abs(dataArray[i] - 128);
          if (deviation > maxDeviation) maxDeviation = deviation;
        }

        // Map maxDeviation (0-128) to 0-100 percentage for UI wave feedback
        const normalized = Math.min(100, Math.round((maxDeviation / 128) * 100));
        setMicVolumeLevel(normalized);

        // A normal speaking voice easily spikes deviation > 15. Ambient hum stays < 5.
        // We trigger on the very first sign of a vocal spike (1 frame) to not cut off the first word.
        if (maxDeviation > 12) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 1) {
`;

// Replace the old frequency logic
content = content.replace(
  /analyser\.getByteFrequencyData\(dataArray\);[\s\S]*?if \(speechConfidenceFrames >= 2\) \{/,
  replacement.trim()
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
