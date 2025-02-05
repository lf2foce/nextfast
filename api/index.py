import base64
import asyncio
import time
import math
import logging
import os
import json

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import OpenAI
from dotenv import load_dotenv

from .services.rubric_evaluator import generate_system_prompt


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
    topic: str
    word_count: int
    score: Score
    feedback: Feedback
    suggestions: List[str]
    original_essay: str
    error: Optional[str] = None

    @classmethod
    def from_essay(
        cls, topic:str, essay_text: str, scores: Dict[str, float], feedback: Dict[str, str], suggestions: List[str]
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
            topic=topic,
            word_count=word_count,
            score=Score(overall_band=overall_band, **scores),
            feedback=Feedback(**feedback),
            suggestions=suggestions,
            error=None  # No error in a successful response
        )

class EssayInput(BaseModel):
    essay_text: str


def process_ielts_essay(essay_text: str):
    """Evaluates the IELTS essay and returns structured scores and feedback."""
    if not essay_text.strip():
        raise HTTPException(status_code=400, detail="Essay text cannot be empty.")

    start_time = time.time()
    print("Generating system prompt...")
    system_prompt = generate_system_prompt()

    completion = client.beta.chat.completions.parse(
        model="gpt-4o",
        messages=[
            {"role": "system", 
             "content": system_prompt},
            {"role": "user", 
             "content": f""" 
               Please evaluate my IELTS writing task. The input contains:
                1. **Topic/Question** (First part of the text, if available).
                2. **Essay Response** (Following text).

                Your task:
                - Identify and extract the **topic/question** if present.
                - If no topic is found, **generate a relevant topic based on the essay**.
                - Evaluate the **essay content** based on the official IELTS writing band descriptors.
                - Provide structured **scores, feedback, and suggestions** for improvement.

                Here is the full input (topic + essay):
                ---
                {essay_text}
                ---
                """}
        ],
        response_format=IELTSWritingEvaluation,
    )
    result = completion.choices[0].message.parsed
    # result.original_essay = essay_text  # Attach original essay
    
    print(f"IELTS Writing Evaluation Result: {result.model_dump_json(indent=4)}")
    execution_time = time.time() - start_time
    print(f"Essay Processing Time: {execution_time:.2f} seconds")
    return result

@app.post("/api/py/evaluate", response_model=IELTSWritingEvaluation)
async def evaluate_ielts_essay(essay_text: Optional[str] = Form(None), file: Optional[UploadFile] = File(None)):
    """Handles both text and image input for essay evaluation."""
    start_time = time.time()
    if not essay_text and not file:
        raise HTTPException(status_code=400, detail="Either text or an image file is required.")

    # If text is provided, evaluate it directly
    if essay_text:
        return process_ielts_essay(essay_text)

    # If a file is uploaded, process it with GPT-4o Vision
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")

        vision_response =  client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", 
                 "content": """You are an advanced IELTS evaluator specializing in text extraction from images. Your task is to accurately extract the **IELTS Writing Task 2 topic and essay** from the provided image. Your response must strictly follow JSON format with no additional explanations, comments, or formatting outside of JSON.

                    ### Extraction Guidelines:
                    1. **Topic Detection**:
                    - Identify and extract the **topic/question** if it is explicitly present in the image.
                    - If no explicit topic is found, **generate a relevant topic based on the essay content**.
                    - Ensure that the extracted topic/question is **precisely worded** and aligned with IELTS Writing Task 2 format.

                    2. **Essay Extraction**:
                    - Extract the full essay **without modifying the original text**.
                    - Preserve paragraph structure and sentence integrity.
                    ### **Your Tasks:**
              

                    3. **Evaluate the essay based on IELTS criteria:**
                    - **Task Response (TR):** Does the essay fully address the topic? Are arguments well-developed?
                    - **Coherence & Cohesion (CC):** Is the essay logically structured with clear paragraphing and linking words?
                    - **Lexical Resource (LR):** How rich and precise is the vocabulary?
                    - **Grammatical Range & Accuracy (GRA):** Are sentences grammatically correct with varied structures?

                    4. **Return a JSON response** with:
                    - `topic`: The extracted or generated topic/question.
                    - `scores`: Band scores (0-9) for TR, CC, LR, and GRA.
                    - `feedback`: Detailed feedback for each criterion.
                    - `suggestions`: Actionable improvements.
                    - `original_essay`: The exact input essay.
                    - `word_count`: The number of words in the essay.
                    """},
                {"role": "user", "content": [
                    {"type": "text", 
                     "text": """"
                        Please evaluate my IELTS writing task from image(s). The input contains:
                        1. **Topic/Question** 
                        2. **Essay Response**

                        Your task:
                        - Identify and extract the **topic/question** if present.
                        - If no topic is found, **generate a relevant topic based on the essay**.
                        - Evaluate the **essay content** based on the official IELTS writing band descriptors.
                        - Provide structured **scores, feedback, and suggestions** for improvement.
                     """},
                    {"type": "image_url", 
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}},
                ]}
            ],
            response_format=IELTSWritingEvaluation,
        )

        try:
            # extracted_text = vision_response.choices[0].message.content
            extracted_text = vision_response.choices[0].message.parsed
            print(f"------------ IELTS Writing Evaluation Result from vision: {extracted_text.model_dump_json(indent=4)}",extracted_text)
            # ✅ Ensure response is JSON by parsing it
          
        except json.JSONDecodeError as e:
            print(f"❌ Error: Could not parse GPT response as JSON - {str(e)}")
            return IELTSWritingEvaluation(error="Failed to extract topic and essay from image.")
        
        # if not essay_text:
        #     raise HTTPException(status_code=400, detail={"error": "Essay text is missing from extracted content."})

        # # ✅ Ensure essay is a single paragraph (remove extra line breaks)
        # essay_text = " ".join(essay_text.split())
    except Exception as e:
        print(f"OpenAI vision API Error: {str(e)}")  # Log the error
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

    execution_time = time.time() - start_time
    print(f"Essay Processing Time: {execution_time:.2f} seconds")
    # return process_ielts_essay(essay_text)
    return extracted_text


@app.post("/api/py/evaluate-multi")
async def evaluate_multiple_images(files: List[UploadFile] = File(...)):
    """Processes multiple images together in a single request."""
    start_time = time.time()
    if not files:
        raise HTTPException(status_code=400, detail="At least one image is required.")

    image_contents = []
    for file in files:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        image_contents.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}})

    vision_response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", 
                 "content": """You are an advanced IELTS examiner specializing in text extraction and evaluation.
                Your task is to **strictly extract one single IELTS Writing Task 2 essay**, even if multiple essays are detected. 
                Select the **most complete** essay only.

                ### **Extraction Guidelines**
                1. **Extract and Merge the Full Essay:**
                - Retrieve the complete essay from all images, ensuring sentence continuity.
                - If two essays exist, select only the one with **the highest word count and completeness**.
                - Preserve paragraph structure and logical flow.
                - If missing words appear due to image cutoffs, infer them where necessary.

                2. **Identify the Topic:**
                - Extract the topic/question if explicitly stated.
                - If missing, generate a relevant topic based on the essay's content.

                3. **Evaluate the Essay Based on Official IELTS Criteria:**
                - **Task Response (TR):** Does the essay fully address the topic? Are arguments well-developed?
                - **Coherence & Cohesion (CC):** Is the essay structured logically with clear paragraphing and linking words?
                - **Lexical Resource (LR):** How varied and precise is the vocabulary?
                - **Grammatical Range & Accuracy (GRA):** Are sentences grammatically correct with diverse structures?

                4. **Provide Feedback and Suggestions:**
                - Constructive feedback for improvement.
                - Specific suggestions on enhancing coherence, vocabulary, and grammar.

                5. **Strict JSON Output Format:** 
                   - Ensure the response **is always valid JSON** and does not contain any extraneous characters.
                   - Do not include markdown formatting like ```json.
                   - Ensure correct nesting of objects and lists.

                6. **Return a Valid JSON Response:** 
                   Ensure the JSON response is strictly formatted as follows:
                {
                    "topic": "Extracted or generated topic",
                    "word_count": 250,
                    "score": {
                        "task_response": 7.0,
                        "coherence_and_cohesion": 6.5,
                        "lexical_resource": 7.5,
                        "grammatical_range_and_accuracy": 6.0,
                        "overall_band": 7.0
                    },
                    "feedback": {
                        "task_response": "Your response is strong but could benefit from more specific examples.",
                        "coherence_and_cohesion": "Logical flow is clear, but transitions could be smoother.",
                        "lexical_resource": "Good vocabulary variety, though some word choices feel repetitive.",
                        "grammatical_range_and_accuracy": "Grammar is mostly accurate, but complex sentence structures need refining."
                    },
                    "suggestions": [
                        "Use more varied linking words to improve cohesion.",
                        "Provide deeper analysis to support key arguments.",
                        "Work on sentence variety to enhance fluency."
                    ],
                    "original_essay": "The full reconstructed essay text."
                }
                

                    """},
            {"role": "user", "content": [
                {"type": "text", "text": "Extract and evaluate the essays in these images based on IELTS criteria."},
                *image_contents
            ]}
        ],
        max_tokens=1000
    )

    try:
        extracted_text = vision_response.choices[0].message.content
        print("------------ extracted text from multiple: ",extracted_text)
        # parsed_response = json.loads(extracted_text)
        # Remove JSON-style formatting and return as a clean dictionary
        parsed_response = json.loads(extracted_text.replace("```json", "").replace("```", "").strip())
        
        # print(f"------------ IELTS Writing Evaluation Result from multiple vision: {parsed_response}")
        print(json.dumps(parsed_response, indent=4, ensure_ascii=False))

        ielts_result = IELTSWritingEvaluation.model_validate(parsed_response)

        # Step 4: Use `.model_dump_json()`
        print(f"✔️ IELTS Writing Evaluation Result: {ielts_result.model_dump_json(indent=4)}")

    
        execution_time = time.time() - start_time
        print(f"Essay Processing Time: {execution_time:.2f} seconds")
        return ielts_result #parsed_response
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to process the images.")
