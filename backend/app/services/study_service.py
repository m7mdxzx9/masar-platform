import logging
from typing import Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate
from app.services.agents.llm_factory import create_chat_llm

logger = logging.getLogger(__name__)

_text_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)

SUMMARIZE_SYSTEM_AR = (
    "أنت مساعد تلخيص متخصص. المهمة: لخص النص التالي بدقة مع الحفاظ على المعلومات الأساسية. "
    "يجب أن يكون الملخص واضحاً ومنظماً ومناسباً للطلاب."
)

SUMMARIZE_SYSTEM_EN = (
    "You are a professional summarization assistant. Task: Summarize the following text accurately "
    "while preserving key information. The summary should be clear, organized, and suitable for students."
)

QA_SYSTEM = (
    "You are a study assistant. Answer the student's question based ONLY on the provided content. "
    "If the answer is not in the content, say so. Be concise and accurate."
)

GUIDE_SYSTEM = (
    "You are a study guide creator. Create a structured study guide for the given subject based on the content provided. "
    "Return the guide as sections with headings and bullet points."
)

FLASHCARD_SYSTEM = (
    "You are a flashcard creator. Create educational flashcards from the given content. "
    "Each card has a question (front) and answer (back). Make them concise and focused on key concepts."
)


async def _llm_call(system: str, user: str, language: str = "ar", provider: Optional[str] = "google") -> str:
    llm = create_chat_llm(temperature=0.3, max_tokens=2048, streaming=False, provider=provider)
    prompt = ChatPromptTemplate.from_messages([
        ("system", system),
        ("user", "{input}"),
    ])
    chain = prompt | llm
    result = await chain.ainvoke({"input": user})
    return result.content


async def summarize_text(content: str, format: str = "bullet", language: str = "ar", provider: Optional[str] = "google") -> dict:
    system = SUMMARIZE_SYSTEM_AR if language == "ar" else SUMMARIZE_SYSTEM_EN

    format_instruction = {
        "bullet": "قدم الملخص على شكل نقاط (bullet points).",
        "paragraph": "قدم الملخص على شكل فقرة مترابطة.",
        "key_points": "استخرج أهم النقاط الرئيسية فقط مع شرح مختصر لكل منها.",
    }

    format_text = format_instruction.get(format, format_instruction["bullet"])

    if len(content) < 2500:
        user = f"{format_text}\n\nالنص:\n{content}"
        summary = await _llm_call(system, user, language, provider=provider)
    else:
        chunks = _text_splitter.split_text(content)
        logger.info(f"Splitting text into {len(chunks)} chunks for summarization")
        summaries = []
        for i, chunk in enumerate(chunks):
            user_chunk = f"لخص هذا الجزء {i + 1}/{len(chunks)}:\n\n{chunk}"
            s = await _llm_call(system, user_chunk, language, provider=provider)
            summaries.append(s)
        combined = "\n\n".join(summaries)
        user_final = f"{format_text}\n\nهذا ملخص أولي للنص. لخصه في ملخص نهائي:\n\n{combined}"
        summary = await _llm_call(system, user_final, language, provider=provider)

    # Extract key points from summary
    key_points_system = (
        "استخرج أهم 3-5 نقاط رئيسية من النص التالي. أعدها كقائمة مرقمة، كل نقطة في سطر منفصل."
    )
    kp_result = await _llm_call(key_points_system, summary, language, provider=provider)
    key_points = [p.strip().lstrip("0123456789.- ") for p in kp_result.split("\n") if p.strip()]

    return {
        "summary": summary.strip(),
        "key_points": key_points,
        "original_length": len(content),
        "summary_length": len(summary.strip()),
    }


async def ask_question(content: str, question: str, provider: Optional[str] = "google") -> dict:
    user = f"المحتوى:\n{content}\n\nالسؤال:\n{question}"
    answer = await _llm_call(QA_SYSTEM, user, provider=provider)
    return {"answer": answer.strip()}


async def generate_guide(content: str, subject: str, provider: Optional[str] = "google") -> dict:
    user = (
        f"المادة: {subject}\n\n"
        f"المحتوى الدراسي:\n{content}\n\n"
        f"أنشئ دليل دراسة منظماً يحتوي على عناوين رئيسية ونقاط لكل قسم."
    )
    result = await _llm_call(GUIDE_SYSTEM, user, provider=provider)

    # Parse sections from result
    sections = []
    current_heading = ""
    current_points = []
    for line in result.split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("##") or (line and not line.startswith("-") and not line.startswith("*") and len(line) < 100 and not line.endswith(":")):
            if current_heading and current_points:
                sections.append({"heading": current_heading, "points": current_points})
                current_points = []
            current_heading = line.lstrip("#").strip()
        elif line.startswith("-") or line.startswith("*"):
            current_points.append(line.lstrip("-* ").strip())
        else:
            current_points.append(line)

    if current_heading and current_points:
        sections.append({"heading": current_heading, "points": current_points})

    if not sections:
        lines = [l.strip() for l in result.split("\n") if l.strip()]
        sections = [{"heading": subject, "points": lines}]

    return {
        "title": f"دليل دراسة: {subject}" if subject else "دليل دراسة",
        "sections": sections,
    }


async def generate_flashcards(content: str, count: int = 5, provider: Optional[str] = "google") -> dict:
    user = (
        f"أنشئ {count} بطاقات تعليمية من المحتوى التالي. "
        f"لكل بطاقة: سؤال في المقدمة (front) وإجابة في الخلف (back).\n\n"
        f"المحتوى:\n{content}\n\n"
        f"التنسيق:\n"
        f"السؤال 1: ...\n"
        f"الإجابة 1: ...\n"
        f"السؤال 2: ...\n"
        f"الإجابة 2: ...\n"
    )
    result = await _llm_call(FLASHCARD_SYSTEM, user, provider=provider)

    cards = []
    lines = result.strip().split("\n")
    current_front = ""
    current_back = ""
    for line in lines:
        line = line.strip()
        if not line:
            continue
        lower = line.lower()
        if lower.startswith("السؤال") or lower.startswith("question") or lower.startswith("front"):
            if current_front and current_back:
                cards.append({"front": current_front, "back": current_back})
            current_front = line.split(":", 1)[1].strip() if ":" in line else line
            current_back = ""
        elif lower.startswith("الإجابة") or lower.startswith("answer") or lower.startswith("back"):
            current_back = line.split(":", 1)[1].strip() if ":" in line else line
        else:
            if current_back:
                current_back += " " + line
            elif current_front:
                current_front += " " + line

    if current_front and current_back:
        cards.append({"front": current_front, "back": current_back})

    if not cards:
        # fallback: treat each line pair as front/back
        pairs = [l for l in lines if l]
        for i in range(0, len(pairs) - 1, 2):
            cards.append({"front": pairs[i], "back": pairs[i + 1]})

    if not cards:
        cards = [{"front": content[:100], "back": "اضغط على البطاقة للكشف"}] if content else []

    return {"cards": cards[:count]}


async def load_file_content(file_path: str) -> str:
    if file_path.lower().endswith('.pdf'):
        try:
            import fitz
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text
        except Exception as e:
            logger.warning(f"Cannot read PDF file {file_path}: {e}")
            return ""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception:
        try:
            with open(file_path, "r", encoding="latin-1") as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Cannot read file {file_path}: {e}")
            return ""
