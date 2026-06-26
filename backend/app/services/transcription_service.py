import os
import logging
from typing import Optional
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)

def transcribe_audio_file(file_path: str) -> str:
    """
    Transcribes an audio file (e.g., mp3, wav, webm) using Google Gemini 1.5 Flash.
    """
    if not settings.google_api_key:
        logger.warning("GOOGLE_API_KEY is not set. Falling back to mock transcription.")
        return "هذا تفريغ نصي تجريبي للمحاضرة المسجلة. يرجى إعداد مفتاح GOOGLE_API_KEY لتفعيل التفريغ الحقيقي عبر نموذج Gemini 1.5 Flash."
        
    try:
        # Initialize client
        client = genai.Client(api_key=settings.google_api_key)
        
        # Upload the file
        logger.info(f"Uploading file to Gemini File API: {file_path}")
        uploaded_file = client.files.upload(file=file_path)
        
        # Generate transcription
        logger.info(f"Generating transcription for file: {uploaded_file.name}")
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[
                uploaded_file,
                "أنت مساعد تفريغ محاضرات جامعية ذكي. "
                "قم بتفريغ التسجيل الصوتي المرفق بدقة شديدة وكتابته بنص عربي أو إنجليزي واضح ومفهوم. "
                "نسق النص الناتج باستخدام Markdown ليكون منظماً وسهل القراءة ويحتوي على عناوين فرعية ونقاط رئيسية عند الحاجة."
            ]
        )
        
        # Clean up the file from Google servers
        try:
            client.files.delete(name=uploaded_file.name)
        except Exception as delete_err:
            logger.warning(f"Failed to delete uploaded file {uploaded_file.name} from Gemini: {delete_err}")
            
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error in Gemini audio transcription: {e}", exc_info=True)
        # Fallback transcription
        return f"فشل التفريغ الصوتي التلقائي بسبب خطأ: {str(e)}\n\n(تنبيه: يمكنك المحاولة مرة أخرى أو مراجعة إعدادات مفتاح API الخاص بك)."
