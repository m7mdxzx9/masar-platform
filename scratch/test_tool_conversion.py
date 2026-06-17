import os
import sys

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.services.tools.agent_tools import ALL_TOOLS
from google.genai import types

def langchain_tool_to_gemini_function(tool) -> types.FunctionDeclaration:
    if hasattr(tool, "args_schema") and tool.args_schema:
        try:
            schema_dict = tool.args_schema.model_json_schema()
        except AttributeError:
            schema_dict = tool.args_schema.schema()
    else:
        schema_dict = {
            "type": "object",
            "properties": tool.args,
            "required": []
        }
    
    def clean_schema(d, is_properties=False):
        if not isinstance(d, dict):
            return d
        cleaned = {}
        for k, v in d.items():
            if k == "type" and isinstance(v, str):
                cleaned[k] = v.upper()
            elif isinstance(v, dict):
                cleaned[k] = clean_schema(v, is_properties=(k == "properties"))
            elif isinstance(v, list):
                cleaned[k] = [clean_schema(x) if isinstance(x, dict) else x for x in v]
            else:
                cleaned[k] = v
        
        if not is_properties:
            for key in ["title", "additionalProperties", "$defs", "definitions"]:
                cleaned.pop(key, None)
        return cleaned

    gemini_schema_dict = clean_schema(schema_dict)
    parameters = types.Schema.model_validate(gemini_schema_dict)
    
    return types.FunctionDeclaration(
        name=tool.name,
        description=tool.description or "",
        parameters=parameters
    )

def main():
    print("Testing tool conversion on ALL_TOOLS...")
    for t in ALL_TOOLS:
        try:
            fd = langchain_tool_to_gemini_function(t)
            print(f"Success for {t.name}: {fd.name}")
            print(f"  Required: {fd.parameters.required}")
            print(f"  Properties: {list(fd.parameters.properties.keys()) if fd.parameters.properties else []}")
        except Exception as e:
            print(f"Failed for {t.name}: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
