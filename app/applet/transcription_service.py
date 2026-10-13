import os
import time
import math
import logging
import asyncio
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from faster_whisper import WhisperModel
import uvicorn
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("transcription-service")

app = FastAPI(title="Yoouz Local Transcription Service")

# Initialize Faster-Whisper model
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "base")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

logger.info(f"Loading Whisper model: {MODEL_SIZE} on {DEVICE}...")
# In this environment, we may want to delay model loading until first use or use a smaller model
model = None

def get_model():
    global model
    if model is None:
        model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return model

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
    hours = math.floor(seconds / 3600)
    minutes = math.floor((seconds % 3600) / 60)
    secs = math.floor(seconds % 60)
    msecs = math.floor((seconds - math.floor(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{msecs:03d}"

def generate_vtt(segments: List[TranscriptSegment]) -> str:
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
    try:
        temp_filename = f"temp_{int(time.time())}_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"Transcribing file: {temp_filename}")
        
        m = get_model()
        segments_gen, info = m.transcribe(
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
        
        if os.path.exists(temp_filename):
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

@app.websocket("/ws/transcribe")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connected for real-time transcription")
    
    # We'll use a local buffer to store incoming PCM chunks
    # Assuming the frontend sends 16-bit PCM at 16kHz
    audio_data = []
    
    try:
        while True:
            # Receive message (can be binary audio or JSON command)
            message = await websocket.receive()
            
            if "bytes" in message:
                data = message["bytes"]
                # Convert bytes to numpy array (16-bit PCM)
                chunk = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0
                audio_data.extend(chunk)
                
                # Every ~3 seconds of audio, we can try to get partial results
                if len(audio_data) >= 16000 * 3:
                    # Partial transcription for live feedback
                    # (In production, use a background thread for this)
                    m = get_model()
                    segments_gen, _ = m.transcribe(
                        np.array(audio_data),
                        beam_size=5,
                        vad_filter=True
                    )
                    
                    last_text = ""
                    for s in segments_gen:
                        last_text = s.text.strip()
                    
                    if last_text:
                        await websocket.send_json({
                            "type": "partial",
                            "text": last_text
                        })
            
            elif "text" in message:
                command = json.loads(message["text"])
                if command.get("type") == "finish":
                    logger.info("Finish command received, generating final transcription")
                    break # Exit loop to run final transcription logic below
                
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected unexpectedly")
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
    
    # Final transcription logic (runs after loop break or disconnect)
    if len(audio_data) > 0:
        try:
            logger.info(f"Processing final transcription for {len(audio_data)/16000:.2f}s of audio")
            m = get_model()
            segments_gen, info = m.transcribe(
                np.array(audio_data),
                beam_size=5,
                word_timestamps=True
            )
            
            final_segments = []
            full_text = ""
            for segment in segments_gen:
                seg_obj = {
                    "start": segment.start,
                    "end": segment.end,
                    "text": segment.text.strip()
                }
                final_segments.append(seg_obj)
                full_text += segment.text + " "
            
            # Send final result if the connection is still open
            try:
                await websocket.send_json({
                    "type": "final",
                    "text": full_text.strip(),
                    "segments": final_segments
                })
            except:
                pass # Connection might be closed already
                
            logger.info(f"Final transcription sent: {len(final_segments)} segments")
        except Exception as e:
            logger.error(f"Final transcription error: {str(e)}")
        finally:
            pass


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
