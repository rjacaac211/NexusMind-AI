from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(title="NexusMind AI Deep Research System")

# Configure CORS middleware
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes under the /api prefix
app.include_router(api_router, prefix="/api")

@app.get("/api/hello")
def read_root():
    return {"message": "Hello from FastAPI!"}
