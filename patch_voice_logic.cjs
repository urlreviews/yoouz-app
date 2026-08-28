const fs = require('fs');
let content = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const target = `
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Map average volume to 0-100 percentage for UI wave feedback
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolumeLevel(normalized);

        // Human voice threshold (> 15 energy floor)
        if (avg > 25) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 15) {
`;

const replacement = `
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
          if (dataArray[i] > peak) peak = dataArray[i];
        }
        const avg = sum / dataArray.length;

        // Map average volume to 0-100 percentage for UI wave feedback
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolumeLevel(normalized);

        // Require both a solid average and a high peak to distinguish from steady background noise
        if (avg > 35 && peak > 120) {
          speechConfidenceFrames++;
          if (speechConfidenceFrames >= 20) {
`;

content = content.replace(target.trim(), replacement.trim());

// Also make sure we don't automatically bypass if AudioContext fails
content = content.replace(
  /\} catch \(e\) \{\n\s*console\.warn\("AudioContext init notice:", e\);\n\s*setIsWaitingForVoice\(false\);\n\s*startActualRecording\(\);\n\s*\}/,
  `} catch (e) {
      console.error("AudioContext init error:", e);
      setErrorMessage("Microphone access is required for voice activation. Please check your permissions or try using a different browser.");
      setIsWaitingForVoice(false);
    }`
);

fs.writeFileSync('src/components/CopoCreateModal.tsx', content);
