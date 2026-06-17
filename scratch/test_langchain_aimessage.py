from langchain_core.messages import AIMessage

def test_message():
    msg = AIMessage(
        content="I will search notes for you.",
        tool_calls=[{
            "name": "search_notes",
            "args": {"query": "linear algebra"},
            "id": "call_123",
            "type": "tool_call"
        }]
    )
    print("AIMessage with tool calls created successfully:", msg)
    print("tool_calls attribute:", msg.tool_calls)

if __name__ == "__main__":
    test_message()
