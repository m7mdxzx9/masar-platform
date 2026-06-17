from google.genai import types

def test_part_call():
    try:
        # Check from_function_call
        part1 = types.Part.from_function_call(
            name="search_notes",
            args={"query": "machine learning"}
        )
        print("Success from_function_call:", part1)
    except Exception as e:
        print("Failed from_function_call:", e)

    try:
        # Check direct initialization
        part2 = types.Part(
            function_call=types.FunctionCall(
                name="search_notes",
                args={"query": "machine learning"}
            )
        )
        print("Success direct function_call:", part2)
    except Exception as e:
        print("Failed direct function_call:", e)

if __name__ == "__main__":
    test_part_call()
