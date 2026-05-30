import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend")

from dotenv import load_dotenv
load_dotenv(os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/backend/.env")

from app.services.study_service import _llm_call

async def test():
    with open("test_lecture.txt", "r", encoding="utf-8") as f:
        text = f.read()

    system = "أنت مدرس خبير في إعداد الاختبارات."
    user = (
        f"المحتوى: {text[:8000]}\n"
        f"المستوى: متوسطة\n"
        f"عدد الأسئلة: 3\n\n"
        f"أنشئ اختباراً من المحتوى أعلاه. التنسيق:\n"
        f"السؤال 1: ...\nأ) ...\nب) ...\nج) ...\nد) ...\n"
        f"الإجابة الصحيحة: حرف الخيار\nالشرح: ...\n"
    )
    result = await _llm_call(system, user)
    with open("scratch/raw_quiz_output.txt", "w", encoding="utf-8") as f:
        f.write(result)
    print("SAVED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test())
