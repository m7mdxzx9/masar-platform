# Masar - منصة تعلم الذكاء الاصطناعي
## MASAR Platform - AI Learning OS v2.0

---

## نظرة عامة

**مسار (Masar)** هي منصة متخصصة لتعلم الذكاء الاصطناعي مصممة للطلاب الجامعيين، تجمع بين التعليم النظري والتطبيق العملي من خلال:

- 🚀 **مسارات تعلم تكيفية** مع Bayesian Knowledge Tracing
- 🤖 **وكلاء ذكيون متعددون** (معلم، محلل كود، مولد مشاريع)
- 💻 **مختبر ذكي** مع Pyodide و WebContainers
- 🎮 **تحديات、游戏化学习** (سباق الحروف، كانبان)
- 🧠 **RAG-powered Memory** للذاكرة السياقية
- ⏳ **Temporal.io Workflows** للمهام طويلة المدى
- 🔄 **Self-Improving System** للتحسين المستمر

---

## البنية المعمارية (Architecture)

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                         │
│  React 19 + TypeScript + Vite + Zustand + WebGPU + Pyodide         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ REST / WebSocket
┌───────────────────────────────┴─────────────────────────────────────┐
│                           BACKEND (FastAPI)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Services Layer                                               │   │
│  │ • Adaptive Learning Engine (BKT)                             │   │
│  │ • Multi-Agent Orchestrator + RAG                             │   │
│  │ • Temporal Worker (Durable Workflows)                        │   │
│  │ • Self-Improver (Feedback-driven prompts)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  PostgreSQL + ChromaDB + Redis + Temporal                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure
```
masar-platform/
├── backend/
│   ├── app/
│   │   ├── api/              # Routes: auth, agents, courses, games, labs, progress, projects
│   │   ├── core/             # Config, database
│   │   ├── models/          # SQLAlchemy: User, Course, Progress, Submission, Feedback
│   │   ├── services/        # Business logic
│   │   │   ├── learning_engine.py    # Bayesian Knowledge Tracing
│   │   │   ├── agent_orchestrator.py  # Multi-agent coordination + RAG
│   │   │   ├── rag_pipeline.py        # ChromaDB integration
│   │   │   ├── temporal_worker.py     # Durable workflows
│   │   │   ├── self_improver.py       # Feedback-driven refinement
│   │   │   ├── workflows.py          # Temporal workflow definitions
│   │   │   └── activities.py         # Temporal activity handlers
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── Dockerfile.worker     # Temporal worker
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── api.ts          # API client
│   │   │   ├── temporal.ts     # Temporal client
│   │   │   ├── webgpu.ts      # WebGPU manager
│   │   │   └── wasm.ts        # WASM bridge
│   │   ├── stores/
│   │   │   ├── aiAgentStore.ts
│   │   │   ├── progressStore.ts   # Adaptive learning state
│   │   │   └── projectStore.ts    # Project workflow state
│   │   ├── components/
│   │   ├── pages/
│   │   └── main.tsx
│   └── package.json
├── temporal/                  # Temporal workflow definitions
├── wasm/                      # Rust → WASM modules
├── MASAR-ARCHITECTURE.md      # Master blueprint
├── start.py / start.bat / start.sh
└── docker-compose.yml
```

---

## التشغيل (Getting Started)

### متطلبات النظام
- **Node.js** >= 18.x
- **Python** >= 3.11
- **Docker** (for full stack)
- **NVIDIA API Key** (for AI agents)

### التشغيل السريع (Quick Start)

```bash
# 1. Clone and setup
git clone <repo>
cd masar

# 2. Setup environment
cp backend/.env.example backend/.env
# Edit .env and add: NVIDIA_API_KEY=nvapi-xxx

# 3. Install dependencies
cd backend && pip install -r requirements.txt && cd ..
cd frontend && npm install && cd ..

# 4. Start services
# Linux/macOS:
./start.sh

# Windows:
start.bat

# Or manually:
cd backend && python -m uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```

### Docker Compose (Full Stack)
```bash
docker-compose up -d --build
```

---

## نقاط الوصول API (Endpoints)

### نظام المصادقة
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | إنشاء حساب |
| POST | `/api/v1/auth/login` | تسجيل الدخول |
| GET | `/api/v1/auth/me` | معلومات المستخدم |

### مسارات التعلم
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/courses/` | قائمة الدورات |
| GET | `/api/v1/courses/{id}` | تفاصيل دورة |
| POST | `/api/v1/courses/` | إنشاء دورة |

### التعلم التكيفي (Adaptive Learning)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/progress/quiz-submit` | Submit quiz response, get BKT update |
| GET | `/api/v1/progress/mastery/{skill_id}` | Get mastery level |
| GET | `/api/v1/progress/learning-path` | Get ordered learning path |
| GET | `/api/v1/progress/recommendations/{module_id}` | Get activity recommendations |
| GET | `/api/v1/progress/stats` | Get overall learning stats |

### الوكلاء الذكيون (AI Agents)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/agents/` | List all agents |
| POST | `/api/v1/agents/chat` | Chat with agent |
| POST | `/api/v1/agents/generate-project` | Generate project idea |
| POST | `/api/v1/agents/analyze-code` | Analyze code |

### مشاريع WorkFlow
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects/generate` | Start project workflow |
| GET | `/api/v1/projects/status/{id}` | Get workflow status |
| POST | `/api/v1/projects/feedback/{id}` | Submit feedback |
| GET | `/api/v1/projects/{id}` | Get project details |

### المختبر الذكي
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/labs/execute` | Execute code |
| POST | `/api/v1/labs/submit` | Submit lab solution |

### الألعاب
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/games/leaderboard` | لوحة المتصدرين |
| GET | `/api/v1/games/challenges` | التحديات |
| POST | `/api/v1/games/submit-score` | إرسال النقاط |

---

## Adaptive Learning Engine (BKT)

### How It Works
The platform uses **Bayesian Knowledge Tracing** to model student mastery:

```python
# BKT State per skill:
p_know     = 0.3   # Prior: student knows the skill
p_guess    = 0.25  # P(correct | don't know)
p_slip     = 0.10  # P(incorrect | know)
p_learn    = 0.20  # P(learning per interaction)

# On each quiz response:
# 1. Calculate prediction before observing
# 2. Update posterior based on correctness
# 3. Apply learning rate
# 4. Return mastery + recommendations
```

### Feedback Loop
```
Quiz → Score → BKT Update → Mastery Level
                                    ↓
              ├─ < 0.5: Remedial content + RAG explanations
              ├─ 0.5-0.8: Practice hints
              └─ > 0.8: Advance + Project suggestions
```

---

## Multi-Agent System

### Available Agents
| Agent | Role | Capabilities |
|-------|------|--------------|
| **AI Tutor** | Conceptual teaching | RAG course content, visual explanations |
| **Python Tutor** | Code & libraries | Pyodide execution, documentation lookup |
| **ML Theory** | Algorithm theory | Math, formulas, derivations |
| **Code Reviewer** | Interview prep | Code analysis, complexity, optimization |
| **Project Generator** | Project ideas | Temporal workflows, skill assessment |
| **Study Coach** | Motivation | Streak tracking, scheduling |
| **Lab Assistant** | Debugging | Code execution, error explanation |

### Context Sharing
All agents share a `SharedContext` containing:
- Current course/module
- Mastery levels (from BKT)
- Recent interactions history
- Learning style preferences

---

## Temporal.io Durable Workflows

### Project Refinement Workflow
```python
# Multi-step project generation that can pause/resume
ProjectRefinementWorkflow:
  1. Generate initial idea (NVIDIA NIM)
  2. Wait for student feedback (durable sleep, up to 7 days)
  3. Refine based on feedback
  4. Create milestone breakdown
```

### Other Workflows
- **AssessmentWorkflow** - Adaptive testing
- **CodeReviewWorkflow** - Comprehensive code feedback
- **LearningPathWorkflow** - Personalized study plans

---

## Self-Improving System

### Feedback Collection
Every agent interaction records:
- User rating (1-5)
- Helpfulness flag
- Prompt/response pair
- Context metadata

### Prompt Refinement Cycle
```python
# Nightly process:
1. Collect low-rated interactions (rating < 3)
2. For each agent with 3+ low ratings:
   - Use NVIDIA NIM to generate improved prompt
   - Create new prompt variant (A/B testing)
   - Rollout to 10% of users
3. Monitor new variant performance
4. Gradually increase rollout
```

---

## Performance Optimization

### WebGPU (ML Visualizations)
- Real-time gradient descent visualization
- Neural network activation maps
- Embedding space explorer

### Rust/WASM (Heavy Compute)
| Module | Purpose |
|--------|---------|
| `bkt_core.wasm` | Fast BKT inference in browser |
| `neural_viz.wasm` | Matrix ops for NN visualization |
| `diff_engine.wasm` | Code/markdown diff |

### Caching Strategy
```
Browser: Zustand (memory) + localStorage
         ↓
Server: Redis (sessions, 1hr TTL)
         ↓
Database: PostgreSQL (persistent)
```

---

## الخدمات (Services)

### Docker Services
| Service | Port | Description |
|---------|------|-------------|
| frontend | 5173 | React dev server |
| backend | 8000 | FastAPI |
| db | 5432 | PostgreSQL |
| chroma | 8001 | ChromaDB vector DB |
| redis | 6379 | Session cache |
| temporal | 7233 | Temporal server |
| temporalui | 8080 | Temporal web UI |

---

## المساهمة (Contributing)

1. Fork المستودع
2. إنشاء فرع جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات
4. Push إلى الفرع
5. فتح Pull Request

---

## الترخيص

MIT License

---

**صنع بشغف بواسطة فريق مسار**