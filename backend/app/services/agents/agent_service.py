from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from app.services.agents.llm_factory import create_chat_llm, create_chat_llm_with_fallback
from app.services.tools.agent_tools import ALL_TOOLS
from app.core.config import settings
from app.utils.semantic_cache import llm_cache
from pydantic import BaseModel, Field
import logging
import json
import re
from typing import AsyncIterator, Optional

logger = logging.getLogger(__name__)

# Pydantic schema for structured AI responses
class ChatResponse(BaseModel):
    message: str = Field(..., description="The main text response from the AI agent")
    confidence: float = Field(default=1.0, description="The AI confidence score for this response")

AGENT_PERSONAS = {
    "math_tutor": (
        "You are an expert mathematics and linear algebra tutor for AI engineering students. "
        "Explain concepts clearly with visual intuition. Use LaTeX for equations. "
        "Provide step-by-step solutions. Respond in the same language the user writes in (Arabic or English)."
    ),
    "python_tutor": (
        "You are an expert Python programming tutor specializing in AI/ML libraries "
        "(NumPy, Pandas, PyTorch, TensorFlow). Write clean, well-commented code. "
        "Explain best practices and optimization techniques. "
        "Respond in the same language the user writes in (Arabic or English)."
    ),
    "ml_theory": (
        "You are a professor of machine learning theory. Explain algorithms, mathematical foundations, "
        "and theoretical concepts with rigor. Use analogies to make complex topics accessible. "
        "Respond in the same language the user writes in (Arabic or English)."
    ),
    "interview_analyzer": (
        "You are an AI technical interview coach. Analyze code submissions for efficiency, correctness, "
        "and style. Provide constructive feedback and suggestions for improvement. "
        "Respond in the same language the user writes in (Arabic or English)."
    ),
    "project_generator": (
        "You are an AI project idea generator and mentor. Given a student's interests and skill level, "
        "suggest structured project ideas with step-by-step implementation guides. "
        "Always consider current market trends and industry needs (2025-2026). "
        "Respond in the same language the user writes in (Arabic or English)."
    ),
    "general": (
        "You are Masar (مسار), a helpful AI learning assistant for university students. "
        "You help with AI, machine learning, programming, and academic topics. "
        "You can search notes, check learning progress, and find code snippets using your tools. "
        "Respond in the same language the user writes in (Arabic or English)."
    ),
}

_graph_cache: dict[str, object] = {}

def extract_partial_message(accumulated: str) -> str:
    match = re.search(r'"message"\s*:\s*"', accumulated)
    if not match:
        match = re.search(r"'message'\s*:\s*'", accumulated)
        if not match:
            return ""
    
    start_idx = match.end()
    content = []
    escaped = False
    for char in accumulated[start_idx:]:
        if escaped:
            if char == 'n':
                content.append('\n')
            elif char == 't':
                content.append('\t')
            elif char == 'r':
                content.append('\r')
            elif char == 'b':
                content.append('\b')
            elif char == 'f':
                content.append('\f')
            else:
                content.append(char)
            escaped = False
        elif char == '\\':
            escaped = True
        elif char == '"':
            break
        else:
            content.append(char)
    return "".join(content)

def _get_compiled_graph(agent_type: str, provider: Optional[str] = None):
    cache_key = (agent_type, provider)
    if cache_key in _graph_cache:
        return _graph_cache[cache_key]

    system_prompt = AGENT_PERSONAS.get(agent_type, AGENT_PERSONAS["general"])
    
    # Enforce Pydantic ChatResponse structure instruction in prompt
    json_instruction = (
        "\n\nYou MUST respond ONLY in valid JSON format matching this schema:\n"
        "{\n"
        '  "message": "your response text here (markdown formatted, including LaTeX equations or GFM tables if necessary)",\n'
        '  "confidence": 0.0 to 1.0 (float)\n'
        "}\n"
        "Ensure your output is strictly a parseable JSON object and nothing else."
    )
    system_prompt += json_instruction

    has_tools = (agent_type == "general")

    llm = create_chat_llm(streaming=True, json_mode=(not has_tools), provider=provider)
    if has_tools:
        llm_with_tools = llm.bind_tools(ALL_TOOLS)
    else:
        llm_with_tools = llm

    async def agent_node(state: MessagesState):
        system = SystemMessage(content=system_prompt)
        messages = [system] + state["messages"]
        try:
            response = await llm_with_tools.ainvoke(messages)
        except Exception as e:
            logger.warning(f"Primary model failed ({e}), retrying with fallback model")
            try:
                fallback_llm = create_chat_llm(
                    streaming=True, 
                    model=settings.openrouter_fallback_model, 
                    json_mode=(not has_tools),
                    provider=provider
                )
                if has_tools:
                    fallback_llm_with_tools = fallback_llm.bind_tools(ALL_TOOLS)
                else:
                    fallback_llm_with_tools = fallback_llm
                response = await fallback_llm_with_tools.ainvoke(messages)
            except Exception as e2:
                logger.error(f"Fallback model also failed: {e2}")
                raise
        return {"messages": [response]}

    tool_node = ToolNode(ALL_TOOLS)

    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    compiled = graph.compile()
    _graph_cache[cache_key] = compiled
    return compiled


def build_agent_graph(agent_type: str = "general", provider: Optional[str] = None):
    return _get_compiled_graph(agent_type, provider)


async def agent_chat_stream(
    message: str,
    agent_type: str = "general",
    conversation_history: list[dict] | None = None,
    provider: Optional[str] = "google",
) -> AsyncIterator[str]:
    # 1. Semantic Cache Check
    cached_json = await llm_cache.get(message, agent_type)
    if cached_json:
        logger.info(f"Semantic Cache Hit for agent_type='{agent_type}'")
        try:
            parsed = json.loads(cached_json.strip())
            clean_message = parsed.get("message", cached_json)
        except Exception:
            clean_message = cached_json
        yield clean_message
        return

    graph = build_agent_graph(agent_type, provider)
    messages = []
    if conversation_history:
        for msg in conversation_history:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
    messages.append(HumanMessage(content=message))

    full_response = ""
    last_sent_message = ""
    try:
        async for event in graph.astream_events(
            {"messages": messages},
            version="v2",
        ):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and isinstance(chunk.content, str) and chunk.content:
                    full_response += chunk.content
                    
                    # Check if stream starts with JSON '{'
                    stripped = full_response.strip()
                    is_json_format = True
                    if len(stripped) > 0:
                        if not stripped.startswith('{') and len(stripped) > 5:
                            is_json_format = False
                            
                    if is_json_format:
                        extracted = extract_partial_message(full_response)
                        if len(extracted) > len(last_sent_message):
                            delta = extracted[len(last_sent_message):]
                            last_sent_message = extracted
                            yield delta
                    else:
                        yield chunk.content
            elif kind == "on_tool_start":
                tool_name = event.get("name", "unknown")
                yield f"\n[Using tool: {tool_name}]\n"
            elif kind == "on_tool_end":
                output = event["data"].get("output", "")
                output_str = str(output)[:300]
                yield f"\n[Tool result: {output_str}]\n"
        
        # Save to semantic cache if successful and not an error
        if full_response and not full_response.strip().startswith("[Error"):
            stripped = full_response.strip()
            final_cache_str = full_response
            if not stripped.startswith('{'):
                # Wrap it in ChatResponse JSON model
                try:
                    res_obj = ChatResponse(message=stripped, confidence=1.0)
                    final_cache_str = res_obj.model_dump_json()
                except Exception:
                    pass
            else:
                # Validate it is valid JSON, if not try to fix or wrap
                try:
                    json.loads(stripped)
                except json.JSONDecodeError:
                    try:
                        extracted_msg = extract_partial_message(full_response)
                        res_obj = ChatResponse(message=extracted_msg or stripped, confidence=1.0)
                        final_cache_str = res_obj.model_dump_json()
                    except Exception:
                        pass
            
            await llm_cache.set(message, agent_type, final_cache_str)

    except Exception as e:
        logger.error(f"agent_chat_stream error: {e}", exc_info=True)
        yield f"\n[Error: {str(e)}]\n"


async def agent_project_ideas(
    interests: str,
    skill_level: str,
    domain: str = "general",
    provider: Optional[str] = "google",
) -> dict:
    prompt = f"interests:{interests}|level:{skill_level}|domain:{domain}"
    
    # 1. Semantic Cache Check
    cached_json = await llm_cache.get(prompt, "project_generator")
    if cached_json:
        logger.info("Semantic Cache Hit for project ideas generator")
        try:
            parsed = json.loads(cached_json.strip())
            clean_message = parsed.get("message", cached_json)
        except Exception:
            clean_message = cached_json
            
        return {
            "agent": "project_generator",
            "interests": interests,
            "skill_level": skill_level,
            "domain": domain,
            "response": clean_message,
        }

    graph = build_agent_graph("project_generator", provider)
    query_prompt = (
        f"Generate detailed graduation project ideas for a student:\n"
        f"- Interests: {interests}\n"
        f"- Skill level: {skill_level}\n"
        f"- Domain: {domain}\n\n"
        f"Consider current 2025-2026 market trends in AI and tech industry. "
        f"For each project idea provide:\n"
        f"1. Project Title\n2. Brief Description\n3. Learning Objectives\n"
        f"4. Step-by-step Implementation Plan\n5. Required Libraries/Tools\n"
        f"6. Expected Timeline\n7. Difficulty Assessment\n8. Potential Extensions\n"
        f"9. Market Relevance (why this project matters now)"
    )
    messages = [HumanMessage(content=query_prompt)]

    full_response = ""
    try:
        async for event in graph.astream_events(
            {"messages": messages},
            version="v2",
        ):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and isinstance(chunk.content, str) and chunk.content:
                    full_response += chunk.content
    except Exception as e:
        logger.error(f"agent_project_ideas error: {e}", exc_info=True)
        full_response = f"Error generating project ideas: {str(e)}"

    # Save to semantic cache if successful
    if full_response and not full_response.startswith("Error"):
        # Wrap/validate JSON
        stripped = full_response.strip()
        final_cache_str = full_response
        if not stripped.startswith('{'):
            try:
                res_obj = ChatResponse(message=stripped, confidence=1.0)
                final_cache_str = res_obj.model_dump_json()
            except Exception:
                pass
        else:
            try:
                json.loads(stripped)
            except json.JSONDecodeError:
                try:
                    extracted_msg = extract_partial_message(full_response)
                    res_obj = ChatResponse(message=extracted_msg or stripped, confidence=1.0)
                    final_cache_str = res_obj.model_dump_json()
                except Exception:
                    pass
        
        await llm_cache.set(prompt, "project_generator", final_cache_str)

    clean_message = full_response
    if full_response.strip().startswith('{'):
        try:
            parsed = json.loads(full_response.strip())
            clean_message = parsed.get("message", full_response)
        except Exception:
            clean_message = extract_partial_message(full_response) or full_response

    return {
        "agent": "project_generator",
        "interests": interests,
        "skill_level": skill_level,
        "domain": domain,
        "response": clean_message,
    }
