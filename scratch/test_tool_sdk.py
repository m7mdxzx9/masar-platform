import os
from google import genai
from google.genai import types

def test_fn():
    fd = types.FunctionDeclaration(
        name="check_skill_mastery",
        description="Check skill mastery",
        parameters=types.Schema(
            type="OBJECT",
            properties={
                "skill_id": types.Schema(type="STRING", description="The skill ID")
            },
            required=["skill_id"]
        )
    )
    t = types.Tool(function_declarations=[fd])
    print("Created Tool successfully:", t)
    
    # Try calling client with tools
    api_key = os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(
        tools=[t],
        temperature=0.4,
    )
    print("GenerateContentConfig with tools:", config)

if __name__ == "__main__":
    test_fn()
