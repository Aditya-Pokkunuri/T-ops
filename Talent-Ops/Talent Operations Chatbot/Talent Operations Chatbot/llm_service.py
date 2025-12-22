# llm_service.py

import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL_NAME = "gpt-4o-mini"   # fast + cheap + great for SQL

def call_llm(prompt: str) -> str:
    """
    Sends a prompt to OpenAI ChatGPT API and returns the response.
    """
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a backend AI that generates SQL and explains results."},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("LLM error:", e)
        return "Sorry, I could not process that."
