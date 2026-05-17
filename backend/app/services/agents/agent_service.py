from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from app.services.agents.llm_factory import create_chat_llm
from app.services.tools.agent_tools import ALL_TOOLS
from app.core.config import settings
import logging
from typing import AsyncIterator

logger = logging.getLogger(__name__)

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


def _get_compiled_graph(agent_type: str):
    if agent_type in _graph_cache:
        return _graph_cache[agent_type]

    system_prompt = AGENT_PERSONAS.get(agent_type, AGENT_PERSONAS["general"])
    llm = create_chat_llm(streaming=True)
    llm_with_tools = llm.bind_tools(ALL_TOOLS)

    async def agent_node(state: MessagesState):
        system = SystemMessage(content=system_prompt)
        messages = [system] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    tool_node = ToolNode(ALL_TOOLS)

    graph = StateGraph(MessagesState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.add_edge(START, "agent")
    graph.add_conditional_edges("agent", tools_condition, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")

    compiled = graph.compile()
    _graph_cache[agent_type] = compiled
    return compiled


def build_agent_graph(agent_type: str = "general"):
    return _get_compiled_graph(agent_type)


async def agent_chat_stream(
    message: str,
    agent_type: str = "general",
    conversation_history: list[dict] | None = None,
) -> AsyncIterator[str]:
    graph = build_agent_graph(agent_type)
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

    try:
        async for event in graph.astream_events(
            {"messages": messages},
            version="v2",
        ):
            kind = event.get("event")
            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and isinstance(chunk.content, str) and chunk.content:
                    yield chunk.content
            elif kind == "on_tool_start":
                tool_name = event.get("name", "unknown")
                yield f"\n[Using tool: {tool_name}]\n"
            elif kind == "on_tool_end":
                output = event["data"].get("output", "")
                output_str = str(output)[:300]
                yield f"\n[Tool result: {output_str}]\n"
    except Exception as e:
        logger.error(f"agent_chat_stream error: {e}", exc_info=True)
        yield f"\n[Error: {str(e)}]\n"


async def agent_project_ideas(
    interests: str,
    skill_level: str,
    domain: str = "general",
) -> dict:
    graph = build_agent_graph("project_generator")
    prompt = (
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
    messages = [HumanMessage(content=prompt)]

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

    return {
        "agent": "project_generator",
        "interests": interests,
        "skill_level": skill_level,
        "domain": domain,
        "response": full_response,
    }
