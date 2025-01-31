from fastapi import FastAPI, UploadFile, File, HTTPException, Form
import base64
# import pandas as pd
from pydantic import BaseModel
from typing import List, Dict, Optional
import math
from openai import OpenAI
from dotenv import load_dotenv
import logging
import os

load_dotenv()

### Create FastAPI instance with custom docs and openapi url
app = FastAPI(title="IELTS Examiner API",
              docs_url="/api/py/docs", 
              openapi_url="/api/py/openapi.json")

@app.get("/api/py/helloFastApi")
def hello_fast_api():
    return {"message": "Hello from FastAPI"}

# Define the scoring criteria
rubrics = {
    "task_response": "Evaluates how well the essay addresses the prompt and develops arguments.",
    "coherence_cohesion": "Assesses logical flow, paragraphing, and use of linking words.",
    "lexical_resource": "Measures vocabulary range and word choice.",
    "grammar_accuracy": "Checks grammatical structures and sentence complexity."
}

class EssayRequest(BaseModel):
    essay: str

class EssayResponse(BaseModel):
    scores: Dict[str, float]
    feedback: Dict[str, str]

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),  # This is the default and can be omitted
)   


# Define Pydantic models
class Score(BaseModel):
    overall_band: float
    task_response: float
    coherence_and_cohesion: float
    lexical_resource: float
    grammatical_range_and_accuracy: float

class Feedback(BaseModel):
    task_response: str
    coherence_and_cohesion: str
    lexical_resource: str
    grammatical_range_and_accuracy: str

class IELTSWritingEvaluation(BaseModel):
    word_count: int
    score: Score
    feedback: Feedback
    suggestions: List[str]

    @classmethod
    def from_essay(
        cls, essay_text: str, scores: Dict[str, float], feedback: Dict[str, str], suggestions: List[str]
    ) -> "IELTSWritingEvaluation":
        """Factory method to compute word count and overall band dynamically"""
        word_count = len(essay_text.split())

        # Compute overall band score using IELTS rounding rules
        avg_score = sum(scores.values()) / len(scores)
        decimal_part = avg_score - math.floor(avg_score)

        if decimal_part < 0.25:
            overall_band = math.floor(avg_score)
        elif decimal_part >= 0.75:
            overall_band = math.ceil(avg_score)
        else:
            overall_band = math.floor(avg_score) + 0.5

        return cls(
            word_count=word_count,
            score=Score(overall_band=overall_band, **scores),
            feedback=Feedback(**feedback),
            suggestions=suggestions
        )

class EssayInput(BaseModel):
    essay_text: str


def process_ielts_essay(essay_text: str):
    """Evaluates the IELTS essay and returns structured scores and feedback."""
    if not essay_text.strip():
        raise HTTPException(status_code=400, detail="Essay text cannot be empty.")

    completion = client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an IELTS writing evaluator. Analyze the essay and provide structured scores, feedback, and suggestions."},
            {"role": "user", "content": f"Evaluate the following IELTS essay:\n{essay_text}"}
        ],
        response_format=IELTSWritingEvaluation,
    )
    return completion.choices[0].message.parsed

@app.post("/api/py/evaluate", response_model=IELTSWritingEvaluation)
async def evaluate_ielts_essay(essay_text: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    """Handles both text and image input for essay evaluation."""
    if not essay_text and not file:
        raise HTTPException(status_code=400, detail="Either text or an image file is required.")

    # If text is provided, evaluate it directly
    if essay_text:
        return process_ielts_essay(essay_text)

    # If a file is uploaded, process it with GPT-4o Vision
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        vision_response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": [
                    {"type": "text", "text": "Analyze the image and extract the IELTS essay along with its topic. Return the response in the exact format below:\n\nTopic:\n<Extracted Topic>\n\nEssay:\n<Extracted Essay>"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                ]}
            ]
        )

        extracted_text = vision_response.choices[0].message.content
        essay_text = extracted_text.split("Essay:")[-1].strip()
        print(f"Extracted text: {essay_text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    return process_ielts_essay(essay_text)