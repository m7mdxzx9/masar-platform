import os
import sys

root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(root_dir)
sys.path.append(os.path.join(root_dir, "backend"))

from app.services.tools.agent_tools import ALL_TOOLS
from scratch.test_tool_conversion import langchain_tool_to_gemini_function

def main():
    for i, t in enumerate(ALL_TOOLS):
        print(f"Index {i}: {t.name}")
        if hasattr(t, "args_schema") and t.args_schema:
            try:
                print("args_schema.model_json_schema():", t.args_schema.model_json_schema())
            except Exception:
                print("args_schema.schema():", t.args_schema.schema())
        else:
            print("args:", t.args)
        
        fd = langchain_tool_to_gemini_function(t)
        print("Gemini representation:", fd)
        print("-" * 50)

if __name__ == "__main__":
    main()
