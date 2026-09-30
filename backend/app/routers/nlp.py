from fastapi import APIRouter
from app.schemas import NLPParsingRequest, NLPParsingResponse
from app.services.gemini_parser import parse_with_gemini

router = APIRouter(prefix="/nlp", tags=["NLP"])

@router.post("/parse", response_model=NLPParsingResponse)
async def parse_input_text(payload: NLPParsingRequest):
    """
    Parses unstructured text from voice or text input using Gemini API extraction spec,
    with smart deterministic NLP fallback.
    """
    parsed = await parse_with_gemini(
        text=payload.text,
        current_lat=payload.current_lat,
        current_lng=payload.current_lng
    )
    return NLPParsingResponse(**parsed)
