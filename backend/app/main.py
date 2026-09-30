from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import reminders, nlp, evaluate, context

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NudgeMe context-aware smart reminder backend engine powered by Gemini NLP and deterministic trigger evaluation.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(reminders.router, prefix=settings.API_V1_STR)
app.include_router(nlp.router, prefix=settings.API_V1_STR)
app.include_router(evaluate.router, prefix=settings.API_V1_STR)
app.include_router(context.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "nudgeme-backend"}
