from google.genai import types

def test_schema():
    # Can we initialize Schema with nested dictionaries?
    s = types.Schema(
        type="OBJECT",
        properties={
            "query": types.Schema(type="STRING", description="The search query")
        },
        required=["query"]
    )
    print("Schema created manually:", s)
    
    # Can we initialize from a dict using Pydantic?
    try:
        # Pydantic v2 style
        s2 = types.Schema.model_validate({
            "type": "OBJECT",
            "properties": {
                "query": {"type": "STRING", "description": "The search query"}
            },
            "required": ["query"]
        })
        print("Schema validated from dict:", s2)
    except Exception as e:
        print("model_validate failed:", e)

if __name__ == "__main__":
    test_schema()
