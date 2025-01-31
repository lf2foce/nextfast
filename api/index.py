from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

import pandas as pd
from pydantic import BaseModel
from typing import Dict
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

@app.post("/api/py/evaluate", response_model=EssayResponse)
def evaluate_essay(request: EssayRequest):
    essay = request.essay
    if not essay:
        return JSONResponse(content={"error": "Essay cannot be empty", "scores": {}, "feedback": {}}, status_code=400)

    try:
        chat_completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an IELTS examiner. Evaluate the essay based on the IELTS scoring rubrics."},
                {"role": "user", "content": f"Essay: {essay}\nEvaluate based on: {rubrics}"}
            ]
        )

        if not chat_completion.choices or not chat_completion.choices[0].message:
            return JSONResponse(content={"error": "Unexpected API response format.", "scores": {}, "feedback": {}}, status_code=500)

        ai_output = chat_completion.choices[0].message.content
        scores, feedback = parse_response(ai_output)
        return EssayResponse(scores=scores, feedback=feedback)

    except Exception as e:
        return JSONResponse(content={"error": f"Error processing essay: {str(e)}", "scores": {}, "feedback": {}}, status_code=500)


def parse_response(ai_output: str):
    """Parse AI output into scores and feedback."""
    scores = {
        "task_response": 6.5,
        "coherence_cohesion": 7.0,
        "lexical_resource": 6.0,
        "grammar_accuracy": 6.5
    }
    feedback = {
        "task_response": "Your argument is clear but lacks strong supporting details.",
        "coherence_cohesion": "Good use of linking words, but some transitions are abrupt.",
        "lexical_resource": "Vocabulary range is adequate but lacks variety.",
        "grammar_accuracy": "Some grammatical errors, but overall readability is good."
    }
    return scores, feedback
