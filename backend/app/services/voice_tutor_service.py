import os
import tempfile
import logging
from typing import Optional, Dict, Any
from app.services.agents.llm_factory import create_chat_llm_with_fallback
from app.services.transcription_service import transcribe_audio_file

logger = logging.getLogger(__name__)

VOICE_TUTOR_SYSTEM_PROMPT_AR = """أنت "المعلم الصوتي الذكي" لجميع علوم الذكاء الاصطناعي والبرمجة في منصة مسار (Masar).
أجب بأسلوب سلس، ممتع، تشجيعي، وواضح جداً باللغة العربية مع مصطلحات إنجليزية تقنية عند الحاجة.

مهمتك:
1. الإجابة عن سؤال الطالب الصوتي أو نص المسألة البرمجية المعطاة.
2. إذا كان هناك كود برمجية متصل بالطلب، شرح الخطأ أو المفهوم بوضوح وتحديد السطر أو الجزء المعني.
3. إبقاء الإجابة مركزة ومباشرة ومناسبة للإلقاء الصوتي.
4. إرجاع النتيجة بتنسيق مفصل ومريح للقراءة والاستماع.
"""

VOICE_TUTOR_SYSTEM_PROMPT_EN = """You are the "Interactive AI Voice Tutor" for AI and Computer Science on the Masar Platform.
Provide encouraging, clear, and easy-to-follow voice-friendly explanations.

Your Goal:
1. Answer student's spoken question or inspect provided lab code context.
2. If there is code/compiler error context, point out the exact line and fix clearly.
3. Keep answers concise, highly engaging, and suitable for audio narration.
"""

class VoiceTutorService:
    @staticmethod
    async def process_audio_query(
        audio_bytes: Optional[bytes] = None,
        audio_filename: Optional[str] = "audio.webm",
        text_query: Optional[str] = None,
        code_context: Optional[str] = None,
        error_context: Optional[str] = None,
        language: str = "ar",
        provider: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Processes audio input or text query alongside Smart Lab code context,
        transcribes audio via Gemini if needed, generates AI tutor explanation,
        and prepares audio synthesis metadata.
        """
        transcribed_text = ""
        
        # 1. Transcribe audio if provided
        if audio_bytes and len(audio_bytes) > 0:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_filename or "audio.webm")[1]) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            try:
                transcribed_text = transcribe_audio_file(tmp_path)
            finally:
                if os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        # Combine student query
        final_query = (transcribed_text + " " + (text_query or "")).strip()
        if not final_query:
            final_query = "اشرح لي خطأ الكود الحالي في المحرر أو كيف يعمل." if language == "ar" else "Explain the current code or error in the editor."

        # 2. Build prompt context
        system_prompt = VOICE_TUTOR_SYSTEM_PROMPT_AR if language == "ar" else VOICE_TUTOR_SYSTEM_PROMPT_EN
        
        user_content_parts = []
        if code_context:
            user_content_parts.append(f"--- [Smart Lab Code Context] ---\n{code_context}\n")
        if error_context:
            user_content_parts.append(f"--- [Compiler / Exception Traceback] ---\n{error_context}\n")
        user_content_parts.append(f"--- [Student Spoken / Text Query] ---\n{final_query}")

        full_user_message = "\n".join(user_content_parts)

        # 3. Call LLM for explanation
        llm = create_chat_llm_with_fallback(
            temperature=0.4,
            max_tokens=1500,
            streaming=False,
            provider=provider,
            model=model,
        )

        response = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": full_user_message},
        ])

        explanation_text = response.content.strip()

        return {
            "transcription": transcribed_text,
            "query_used": final_query,
            "explanation": explanation_text,
            "language": language,
            "has_code_context": bool(code_context),
        }

voice_tutor_service = VoiceTutorService()
