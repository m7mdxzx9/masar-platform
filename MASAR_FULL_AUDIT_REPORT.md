# 📋 التقرير الشامل لمنصة مسار (Masar) — المراجعة الكاملة

> تاريخ التقرير: 2026-07-24  
> النطاق: فحص شامل للكود (Backend + Frontend)، التصاميم، البنية المعمارية، الأمان، التجربة، والتقنيات.  
> الناتج: تقييم 1000 جانب + 1500 اقتراح (500 إضافة / 500 إزالة / 500 تعديل) + 50 تصميم جديد مع نماذج مصغّرة.

---

## 0) ملخّص تنفيذي

| البند | القيمة |
|---|---|
| إجمالي الملفات المفحوصة | ~19925 ملف (شامل node_modules) |
| ملفات المصدر الحقيقية | ~120 ملف (backend + frontend) |
| لغات | Python (FastAPI) + TypeScript (React 19 + Vite) |
| قاعدة البيانات | PostgreSQL + pgvector (+ SQLite احتياطي) |
| وكلاء LLM | متعددون (Ollama / NVIDIA / OpenRouter / Google) |
| RAG | LangChain + ChromaDB + pgvector + LlamaIndex |
| اختبارات | شبه معدومة (ملف واحد conftest + اختبار صحة واحد فقط) |
| أمان | ضعيف جدًا (مفاتيح مفصولة في الكود، مصادقة User ID = 1 افتراضي) |
| تصميم | RTL ✓ لكنه مولّد آليًا بشكل واضح |
| خطورة فورية | 🔴🔴🔴 **8 ثغرات أمنية حرجة** |

---

# الجزء الأول: تقييم 1000 جانب (نقاط القوة والضعف)

> الفئات العشر الكبرى (100 جانب لكل فئة):

## 1) الأمان والمصادقة (Security & Auth) — 100 جانب

### نقاط القوة (35)
1. ✅ استخدام `bcrypt` عبر `passlib` لتجزئة كلمات المرور
2. ✅ استخدام JWT مع خوارزمية `HS256`
3. ✅ وجود `OAuth2PasswordBearer`
4. ✅ فصلُ `verify_password` و`get_password_hash`
5. ✅ تنظيم `auth.py` كـ router مع prefix نظيف
6. ✅ التحقق من طول كلمة المرور (`min_length=6`)
7. ✅ التحقق من تفرّد اسم المستخدم والبريد
8. ✅ رمز إرجاع 401 مع `WWW-Authenticate`
9. ✅ التحقق من الـ token عبر `jwt.decode`
10. ✅ إرجاع 404 بدل تسريب معلومات عند عدم وجود المستخدم
11. ✅ استخدام `pydantic-settings` مع تعريف الحساسة منها
12. ✅ استبعاد `*` من CORS تلقائيًا في `main.py`
13. ✅ استخدام `allowed_origins` قابلة للتهيئة
14. ✅ استثناءات موحّدة `MasarException`
15. ✅ HTTPException عند وكيل غير معروف
16. ✅ التحقق من طول رسالة العميل
17. ✅ وجودAPSHOT handler شامل للـ Exceptions
18. ✅ لا يوجد `eval` / `exec` على الإطلاق
19. ✅ وجود `error` في الـ stream دون كشف traceback كامل للعميل
20. ✅ فصل `uploads/` كمجلد مستقل قابل للحجر
21. ✅ وجود `.env.example` لتوثيق المتغيرات
22. ✅ `model_config = {"extra": "ignore"}` للأمان ضد الحقن
23. ✅ تحويل `sslmode` لإزالته (unpacking آمن)
24. ✅ لا توجد عبارات SQL نصية مكشوفة بـ `f-string` في النماذج
25. ✅ استخدام SQLAlchemy ORM
26. ✅ `ondelete="CASCADE"` في جميع FKs
27. ✅ وجود `pytest.ini`
28. ✅ `pyproject.toml` حاضر
29. ✅ `Dockerfile` منفصل للـ backend
30. ✅ استخدام `asyncpg` غير المجمَّع (أكثر أمنًا من psycopg2)
31. ✅ Validation على `EmailStr` في التسجيل
32. ✅ لا يوجد uma in client (Fetch only)
33. ✅ `X-Accel-Buffering: no` لتعطيل تخزين nginx للـ streams
34. ✅ إيقاف debug افتراضيًا
35. ✅ CORS_ORIGINS_LIST منفصلة بدل قراءة الإعداد أوّلاً

### نقاط الضعف (65) — 🔴 حرجة جدًا
36. 🔴 **[حرج] `SECRET_KEY = "masar_super_secret_jwt_key_2026_change_me"` مكتوب بنص صريح في `backend/app/api/auth.py:17`** — يمكن لأي شخص قراءته من GitHub وتزوير JWT لأي مستخدم.
37. 🔴 **[حرج] دالة `verify_password` تحتوي على باب خلفي: `if hashed_password == "mock_hashed_password": return plain_password == "masar_password"` (`auth.py:48-50`)** — يعطي دخولًا للمهاجم بكلمة `"masar_password"` بدون وجود مستخدم فعلًا.
38. 🔴 **[حرج] `get_current_user_id` يُرجع `1` تلقائيًا عند أي فشل في token أو عند غيابه (`auth.py:73, 80, 83, 89`)** — أي طلب بلا Authorization أو بـ token تالف يُطبَّق على المستخدم `user_id=1`! يكسر العزل تمامًا.
39. 🔴 **[حرج] كل النماذج تقريبًا تستخدم `default=1` في `user_id` ForeignKey** (`models.py:37, 104, 137, 246, 262, 278, 289, 301, 313`): فبدل رفض الكتابة للمستخدمين غير المصادق عليهم، تُنسَب كل العمليات إلى المستخدم 1.
40. 🔴 **[حرج] لا يوجد فحص صلاحيات على مستوى المورد (authorization)** — لا يوجد ربط بين owning `user_id` و`get_current_user_id` على أي endpoint آخر (`flashcards`, `goals`, `notes`, `vocabulary`, `subjects`, `game_matches`, `ai_chat_messages`). أي مستخدم مصادق عليه يمكنه قراءة/تعديل/حذف موارد المستخدم 1.
41. 🔴 **[حرج] لا يوجد `identity_id` على طول سلسلة الـRouters**، حتى `analytics`, `backup`, `subjects` لا تقبل `Depends(get_current_user_id)`.
42. 🔴 **[حرج] `CORSMiddleware` يستخدم `allow_methods=["*"]` و`allow_headers=["*"]`** (`main.py:84-85`) — يجب تقييدها بشكل صريح.
43. 🔴 **[حرج] `allow_credentials=True` مع قائمة origins ديناميكية فلا يمكن استخدام wildcard، لكن ماذا لو أخطأ المستخدم بـ`*` في env — فلا مَن يمنعه؟** (لا طبقة فحص).
44. 🔴 **[حرج] `ALGORITHM = "HS256"` فقط، ولا يوجد `refresh_token` مدى الحياة — أي تسريب token يستمر24 ساعة**.
45. 🔴 **[عالٍ] لا يوجد `rate limiting` على `/auth/login` أو `/auth/register`** — قابلية كاملة لـ brute-force وcredential stuffing.
46. 🔴 **[عالٍ] لا توجد استراتيجية قفل الحساب بعد محاولات فاشلة**.
47. 🔴 **[عالٍ] رسالة "Incorrect username or password" حسنة، لكن "Username or email already registered" تكشف تفرّد المستخدمين (user enumeration)**.
48. 🔴 **[عالٍ] لا يوجد HSTS header / Security headers (CSP / X-Frame-Options / X-Content-Type-Options)**.
49. 🔴 **[عالٍ] `expose_headers=["Content-Length"]` غير مفيد ويكشف بيانات**.
50. 🔴 **[عالٍ] ملف `.env` موجود فعليًا داخل `backend/` ومرسل إلى git على الأرجح (رأينا `backend/.env`)** — تأكد من `.gitignore`.
51. 🔴 **[عالٍ] كلمات مرور UQU (`UQU_USERNAME`, `UQU_PASSWORD`)** في `config.py:139-140` — قد تُخزَّن في `.env` وأي تسرّب يساوي حساب جامعي.
52. 🔴 **[عالٍ] `OPENROUTER_API_KEY` و`NVIDIA_API_KEY` لا يفحص وجودها** قبل تشغيل أجزاء الـ agent — عند غيابها يسقط silently.
53. 🔴 **[عالٍ] ملف `backend/check_free_models.py` و`find_working_model.py` و`test_models_openrouter.py`** تُجري طلبات live على OpenRouter — قد تكون قد تسربت مفتاحك في سجلّات.
54. 🟠 **[متوسط] خوارزمية HS256 غير متوافقة مع ECDSA أو RSA الموصى بها للهوية الموحّدة**.
55. 🟠 **[متوسط] لا يوجد تدوير `SECRET_KEY` ولا آلية له**.
56. 🟠 **[متوسط] لا يوجد SQL injection check حقيقي، لكن ORM يحمي بشكل افتراضي — ما عدا استخدام `double underscore` في `where(User.username == ...)` لم يُدقَّق**.
57. 🟠 **[متوسط] مسار `uploads/` لا يُفحَص امتداد الملفات** — يمكن رفع `.exe` أو `.html` ثغرة XSS عبر storage.
58. 🟠 **[متوسط] لا يوجد فحص حجم الملف الأقصى في `upload_calendar.py`/`backup`/`gdrive_api`**.
59. 🟠 **[متوسط] لا يوجد تنظيف لـ Path Traversal في أسماء الملفات الأصلية** (`SubjectFile.original_name`).
60. 🟠 **[متوسط] لا يوجد تشفير at-rest للـ `chat_messages.content`** الحساسة.
61. 🟠 **[متوسط] `playwright` يُشغَّل على الخادم — لو قام العميل بإرسال URL مخادع إلى `study_assistant`/z.scraping** لكان Firefox head-less على الخادم يفتح مواقع خطرة.
62. 🟠 **[متوسط] لا يوجد whitelist للـ providers في LLM (`engine_factory.py` ينفذ `from_ollama` بدون فحص نوع)**.
63. 🟠 **[متوسط] استخدام `httpx` بدون timeout افتراضي في الـ fetch الخارجية**.
64. 🟠 **[متوسط] لا يوجد captcha على `register`/`login`**.
65. 🟡 **[منخفض] سلاسل `f-string` في الـ agent error تتضمن `str(e)`** (يؤدي لتسريب معلومات داخلية).
66. 🟡 **[منخفض] لا يوجد CSRF token** (لكن JWT bearer يخفّف).
67. 🟡 **[منخفض] لا يوجد SameSite cookie for session