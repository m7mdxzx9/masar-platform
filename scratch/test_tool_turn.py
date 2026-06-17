from google.genai import types

def test_tool_turn():
    part = types.Part.from_function_response(
        name="search_notes",
        response={"result": "some notes content"}
    )
    content = types.Content(role="tool", parts=[part])
    print("Tool Content turn created successfully:", content)

if __name__ == "__main__":
    test_tool_turn()
