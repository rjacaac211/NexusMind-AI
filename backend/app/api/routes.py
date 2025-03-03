import os
import httpx
import pdfkit
import markdown
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel

from app.core.deep_research_agent import run_agent

router = APIRouter()

# ----------------- Start Research Endpoint ----------------- #
class ResearchRequest(BaseModel):
    topic: str

@router.post("/start_research")
async def start_research(req: ResearchRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required.")
    try:
        bot_message = await run_agent(req.topic)
        return {"bot_message": bot_message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------- Resume Research Endpoint ----------------- #
class ResumeRequest(BaseModel):
    topic: str
    feedback: str

@router.post("/resume")
async def resume_research(req: ResumeRequest):
    if not req.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback is required.")
    try:
        result = await run_agent(req.topic, req.feedback)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# ----------------- Speech-to-Text Endpoint ----------------- #
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
if not DEEPGRAM_API_KEY:
    print("WARNING: DEEPGRAM_API_KEY is not set. STT endpoint will fail if called.")

@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    session_id: str = Form(...)
):
    """
    Receives an audio file (e.g. from the frontend),
    calls Deepgram for transcription, and returns the transcript.
    """
    # Read the raw audio bytes
    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="No audio data received.")

    if not DEEPGRAM_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="Deepgram API key is missing on the server."
        )

    # Example: Using Deepgram's /listen endpoint
    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/octet-stream"
    }

    params = {
        "model": "nova",        # or 'general', etc.
        "punctuate": "true",
        # "language": "en",     # optionally specify language
        # Additional STT params as needed...
    }

    # Make async call to Deepgram
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.deepgram.com/v1/listen",
            headers=headers,
            params=params,
            content=audio_bytes  # raw audio
        )

    if response.status_code != 200:
        print("Deepgram error:", response.text)
        raise HTTPException(
            status_code=500,
            detail=f"Deepgram API error: {response.text}"
        )

    data = response.json()
    # Extract transcript from Deepgram response
    transcript = (
        data.get("results", {})
            .get("channels", [{}])[0]
            .get("alternatives", [{}])[0]
            .get("transcript", "")
    )

    return {"transcript": transcript}

# ----------------- Generate PDF Endpoint ----------------- #
class PDFRequest(BaseModel):
    final_report: str

@router.post("/generate_pdf")
def generate_pdf(payload: PDFRequest):
    """
    Convert the final report (Markdown) to a PDF and return it.
    """
    try:
        # 1. Convert Markdown -> HTML
        html_content = markdown.markdown(
            payload.final_report,
            extensions=["tables", "fenced_code", "nl2br"]
            )

        # 2. Generate PDF bytes in memory
        # The second arg "False" tells pdfkit to return the bytes rather than write to file
        pdf_bytes = pdfkit.from_string(html_content, False)

        # 3. Return PDF as a response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'inline; filename="final_report.pdf"'}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# # ----------------- Save Chat History Endpoint ----------------- #
# class ChatMessage(BaseModel):
#     session_id: str
#     sender: str
#     message: str

# @router.post("/save_chat")
# async def save_chat_history(chat: ChatMessage):
#     print("Received chat:", chat)
#     chat_dict = chat.dict()
#     chat_dict["timestamp"] = datetime.utcnow()
    
#     result = await db.chat_history.insert_one(chat_dict)
#     if result.inserted_id:
#         return {"message": "Chat saved successfully", "id": str(result.inserted_id)}
#     raise HTTPException(status_code=500, detail="Failed to save chat history")

# @router.get("/chat_history/{session_id}")
# async def get_chat_history(session_id: str):
#     history = await db.chat_history.find({"session_id": session_id}).to_list(length=100)
#     # Convert MongoDB-specific types to JSON-serializable types
#     for doc in history:
#         doc["_id"] = str(doc["_id"])
#         if "timestamp" in doc:
#             doc["timestamp"] = str(doc["timestamp"])
#     return {"chat_history": history}
