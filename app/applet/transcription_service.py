import os
import time
import math
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from faster_whisper import WhisperModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcription-service")

app = FastAPI(title="Yoouz Local Transcription Service")

# Initialize Faster-Whisper model
# Using 'base' model for a good balance of speed and accuracy
# In a real production environment with GPU, 'large-v3' is recommended
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")  # Change to "cuda" if GPU is available
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

logger.info(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE}...")
model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)

class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    words: Optional[List[dict]] = None

class TranscriptionResponse(BaseModel):
    text: str
    segments: List[TranscriptSegment]
    language: str
    duration: float
    vtt_content: str

def format_timestamp(seconds: float) -> str:
    """Formats seconds into WebVTT timestamp format (HH:MM:SS.mmm)"""
    hours = math.floor(seconds / 3600)
    minutes = math.floor((seconds % 3600) / 60)
    secs = math.floor(seconds % 60)
    msecs = math.floor((seconds - math.floor(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{msecs:03d}"

def generate_vtt(segments: List[TranscriptSegment]) -> str:
    """Generates WebVTT content from segments"""
    vtt = ["WEBVTT", ""]
    for i, seg in enumerate(segments):
        start_t = format_timestamp(seg.start)
        end_t = format_timestamp(seg.end)
        vtt.append(f"{i+1}")
        vtt.append(f"{start_t} --> {end_t}")
        vtt.append(seg.text.strip())
        vtt.append("")
    return "\n".join(vtt)

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Receives an audio/video file and returns transcription with timestamps and VTT.
    """
    try:
        # Save temporary file
        temp_filename = f"temp_{int(time.time())}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Transcribing file: {temp_filename}")
        
        # Transcribe
        # word_timestamps=True provides granular data for "premium" synced display
        segments_gen, info = model.transcribe(
            temp_filename, 
            beam_size=5, 
            word_timestamps=True
        )
        
        segments = []
        full_text = ""
        
        for segment in segments_gen:
            seg_obj = TranscriptSegment(
                start=segment.start,
                end=segment.end,
                text=segment.text,
                words=[{"start": w.start, "end": w.end, "word": w.word, "probability": w.probability} for w in segment.words] if segment.words else None
            )
            segments.append(seg_obj)
            full_text += segment.text + " "
        
        # Cleanup temp file
        os.remove(temp_filename)
        
        vtt_content = generate_vtt(segments)
        
        return TranscriptionResponse(
            text=full_text.strip(),
            segments=segments,
            language=info.language,
            duration=info.duration,
            vtt_content=vtt_content
        )
        
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
