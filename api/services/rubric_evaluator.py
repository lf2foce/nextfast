import pandas as pd
import os

# RUBRIC_PATH = os.path.join(os.path.dirname(__file__), "../../data/rubrics.csv")

import pandas as pd

# Predefined IELTS scoring rubric as a pandas DataFrame
rubric_data = {
    "Criteria": [
        "Task Response",
        "Coherence & Cohesion",
        "Lexical Resource",
        "Grammatical Range & Accuracy"
    ],
    "Description": [
        "Evaluates how well the essay addresses the prompt, develops arguments, and provides evidence.",
        "Assesses logical flow, paragraphing, and the use of cohesive devices.",
        "Measures vocabulary range, precision, and appropriateness.",
        "Checks grammatical structures, sentence complexity, and accuracy."
    ],
    "Band 9": [
        "Fully addresses all aspects of the task. Strong arguments, excellent evidence, and insightful ideas.",
        "Seamless logical flow. Exceptional paragraphing and diverse use of linking words.",
        "Sophisticated vocabulary with precise word choice. Wide range of expressions.",
        "Flawless grammar with natural and complex structures."
    ],
    "Band 7": [
        "Covers all aspects well but may lack depth in argumentation.",
        "Good coherence with clear paragraphs. Some minor cohesion issues.",
        "Good range of vocabulary, with occasional inappropriate word choices.",
        "Generally accurate grammar with occasional errors in complex sentences."
    ],
    "Band 5": [
        "Partially addresses the task. Some ideas underdeveloped or off-topic.",
        "Some organizational issues. Limited use of linking words.",
        "Limited vocabulary range, occasional awkward phrasing.",
        "Frequent grammar errors affecting clarity and readability."
    ],
    "Band 3": [
        "Minimal relevance to the topic. Arguments are unclear or missing.",
        "Lacks organization. No clear paragraphing or logical structure.",
        "Very limited vocabulary. Many unnatural word choices.",
        "Severe grammatical issues. Sentence construction is basic and often incorrect."
    ]
}

# Convert to a pandas DataFrame
rubric_df = pd.DataFrame(rubric_data)




def load_rubric():
    """
    Loads rubrics from a CSV file and converts them into a dictionary.
    Returns:
        rubric_dict (dict): A dictionary representation of the rubric.
    """
    try:
        # df = pd.read_csv(RUBRIC_PATH)
        df = rubric_df.copy()
        
        rubric_dict = {
            "Criteria": df["Criteria"].tolist(),
            "Description": df["Description"].tolist(),
            "Band 9": df["Band 9"].tolist(),
            "Band 7": df["Band 7"].tolist(),
            "Band 5": df["Band 5"].tolist(),
            "Band 3": df["Band 3"].tolist()
        }
        return rubric_dict
    except Exception as e:
        print(f"Error loading rubric: {e}")
        return {}

def generate_system_prompt():
    """
    Generates a system prompt dynamically based on the rubric loaded from a CSV file.
    """
    rubric = load_rubric()

    if not rubric:
        return "Error: Rubric not found."

    rubric_text = "\n".join(
        [f"- **{criterion}**: {description}" 
         for criterion, description in zip(rubric["Criteria"], rubric["Description"])]
    )

    band_scores_text = "\n".join(
        [f"**{band}**: " + ", ".join(
            [f"{criterion}: {score}" for criterion, score in zip(rubric["Criteria"], rubric[band])]
        ) for band in ["Band 9", "Band 7", "Band 5", "Band 3"]]
    )

    rubric_ielts= f"""
    You are an expert examiner evaluating writing responses based on the following rubric:

    ### **Evaluation Criteria**
    {rubric_text}

    ### **Band Descriptors**
    {band_scores_text}

    Your task:
    - Identify the topic/question in the response.
    - Score the essay based on the rubric.
    - Provide structured feedback for each criterion.
    - Give actionable improvement suggestions.

    Return your response in the following structured JSON format:
    ```json
    {{
      "topic": "Extracted or generated topic",
      "word_count": 250,
      "scores": {{
        "task_response": 7.0,
        "coherence_and_cohesion": 6.5,
        "lexical_resource": 7.5,
        "grammatical_range_and_accuracy": 6.0,
        "overall_band": 7.0
      }},
      "feedback": {{
        "task_response": "Your response is strong but could benefit from more specific examples.",
        "coherence_and_cohesion": "Logical flow is clear, but transitions could be smoother.",
        "lexical_resource": "Good vocabulary variety, though some word choices feel repetitive.",
        "grammatical_range_and_accuracy": "Grammar is mostly accurate, but complex sentence structures need refining."
      }},
      "suggestions": [
        "Use more varied linking words to improve cohesion.",
        "Provide deeper analysis to support key arguments.",
        "Work on sentence variety to enhance fluency."
      ],
      "original_essay": "The full essay text"
    }}
    ```
    """
    # print(rubric_ielts)
    return rubric_ielts
# generate_system_prompt()