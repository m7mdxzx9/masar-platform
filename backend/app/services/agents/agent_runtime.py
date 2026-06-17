import re
import os
import sys
import json
import logging
import tempfile
import subprocess
from typing import AsyncIterator, Dict, Any, List, Optional
from app.services.agents.llm_factory import create_chat_llm
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

logger = logging.getLogger(__name__)

# Secure Python Code Sandbox Execution
def execute_python_sandbox(code: str) -> str:
    # Clean code formatting if wrapped in markdown
    clean_code = re.sub(r"^```python\s*|\s*```$", "", code, flags=re.MULTILINE).strip()
    
    # Write to a temporary file
    try:
        with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as temp_file:
            temp_file.write(clean_code)
            temp_file_name = temp_file.name
        
        try:
            # Run code in sandbox with timeout of 5.0 seconds
            result = subprocess.run(
                [sys.executable, temp_file_name],
                capture_output=True,
                text=True,
                timeout=5.0
            )
            output = result.stdout
            if result.stderr:
                output += "\n" + result.stderr
            return output if output.strip() else "✅ تم تنفيذ الكود بنجاح دون طباعة أي مخرجات."
        except subprocess.TimeoutExpired:
            return "❌ خطأ: انتهت مهلة تشغيل الكود (الحد الأقصى 5 ثوانٍ)."
        finally:
            if os.path.exists(temp_file_name):
                os.remove(temp_file_name)
    except Exception as e:
        return f"❌ خطأ داخلي أثناء تشغيل Sandbox: {str(e)}"

# ReAct Agent Thinking Loop
async def run_react_agent(message: str, provider: str = "google", model: Optional[str] = None) -> AsyncIterator[str]:
    llm = create_chat_llm(temperature=0.2, max_tokens=2048, streaming=False, provider=provider, model=model)
    
    system_prompt = """أنت وكيل ذكاء اصطناعي مستقل ومساعد برمجيات خبير (Autonomous ReAct Agent).
مهمتك هي مساعدة طالب هندسة الذكاء الاصطناعي في حل المسائل الرياضية أو البرمجية.

لديك القدرة على تشغيل كود بايثون محلياً للتحقق من الحلول أو القيام بحسابات رياضية معقدة عبر أداة "ExecutePython".

يجب أن تتبع هيكل التفكير والعمل (ReAct) التالي في كل خطوة:
1. Thought: التفكير في الخطوة التالية وما الذي تحتاجه لحل المشكلة.
2. Action: اسم الأداة والوسيط المراد تشغيلها. الأداة الوحيدة المتاحة لديك هي:
   - `ExecutePython(code: str)`: تشغيل كود بايثون محلياً وإرجاع المخرجات.
3. Observation: مخرجات تشغيل الأداة (سيتم تزويدك بها بعد كل Action).

عندما تصل للحل النهائي أو لا تحتاج لمزيد من تشغيل الأكواد، يجب أن تكتب:
Thought: لدي الإجابة النهائية الآن.
Final Answer: الشرح والحل النهائي المفصل باللغة العربية.

مثال للمحادثة:
Thought: أحتاج لحساب مجموع الأرقام الفردية من 1 إلى 50. سأكتب كود بايثون لحساب ذلك.
Action: ExecutePython(code="print(sum(i for i in range(1, 51) if i % 2 != 0))")
Observation: 625
Thought: المجموع هو 625. سأقوم بصياغة الإجابة النهائية للمستخدم.
Final Answer: مجموع الأرقام الفردية من 1 إلى 50 هو 625.

تنبيه هام جداً:
* يجب أن تكتب خطوات الـ Thought و الـ Action باللغة الإنجليزية أو العربية، ولكن الـ Final Answer يجب أن يكون باللغة العربية الفصحى المبسطة دائماً.
* لا تقم باختصار الخطوات. اكتب خطوة Action واحدة في المرة، وانتظر الـ Observation.
"""

    agent_history = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"المهمة المطلوبة: {message}")
    ]
    
    yield "data: [START_AGENT_LOOP]\n\n"
    
    max_iterations = 6
    for iteration in range(max_iterations):
        yield f"data: [THINKING_STEP] الخطوة {iteration + 1}...\n\n"
        
        try:
            # Query the LLM
            response = await llm.ainvoke(agent_history)
            response_text = response.content
            
            # Send the model's raw thought text to the frontend
            sse_lines = [f"data: [AGENT_THOUGHT]"]
            for line in response_text.split("\n"):
                sse_lines.append(f"data:   {line}")
            yield "\n".join(sse_lines) + "\n\n"
            
            # Parse the response for Action
            # Match formats: Action: ExecutePython(code="...") or Action: ExecutePython(code="""...""")
            action_match = re.search(r"Action:\s*(\w+)\((?:code=)?[\"\']{1,3}(.*?)[\"\']{1,3}\)", response_text, re.DOTALL | re.IGNORECASE)
            
            # Fallback action regex if formatting is slightly different
            if not action_match:
                action_match = re.search(r"Action:\s*ExecutePython\((.*?)\)", response_text, re.DOTALL | re.IGNORECASE)
            
            if action_match:
                tool_name = "ExecutePython"
                # Extract code content
                raw_code = action_match.group(2) if len(action_match.groups()) >= 2 else action_match.group(1)
                
                # If code parameter name is still inside raw_code, strip it
                if raw_code.strip().startswith("code="):
                    raw_code = re.sub(r"^code=[\"\']{1,3}|[\"\']{1,3}$", "", raw_code.strip())
                
                yield f"data: [RUNNING_TOOL] جاري تشغيل الأداة: {tool_name}...\n\n"
                
                # Execute tool
                observation = execute_python_sandbox(raw_code)
                
                sse_lines = [f"data: [TOOL_OBSERVATION]"]
                for line in str(observation).split("\n"):
                    sse_lines.append(f"data: {line}")
                yield "\n".join(sse_lines) + "\n\n"
                
                # Append model thought and observation to history
                agent_history.append(AIMessage(content=response_text))
                agent_history.append(HumanMessage(content=f"Observation: {observation}"))
                
            elif "Final Answer:" in response_text:
                # Agent has arrived at the final answer
                final_answer_match = response_text.split("Final Answer:")
                answer = final_answer_match[-1].strip()
                sse_lines = [f"data: [FINAL_ANSWER]"]
                for line in answer.split("\n"):
                    sse_lines.append(f"data: {line}")
                yield "\n".join(sse_lines) + "\n\n"
                break
            else:
                # No clear action or final answer found. Force a final response
                sse_lines = [f"data: [FINAL_ANSWER]"]
                for line in response_text.split("\n"):
                    sse_lines.append(f"data: {line}")
                yield "\n".join(sse_lines) + "\n\n"
                break
                
        except Exception as e:
            logger.error(f"Error in ReAct loop step: {e}")
            yield f"data: [AGENT_ERROR] حدث خطأ أثناء معالجة تفكير الوكيل: {str(e)}\n\n"
            break
            
    yield "data: [DONE]\n\n"
