# MASAR Platform - Master Architecture Blueprint 2026

## 1. System Overview

**Masar** is a single-user AI learning OS for university AI engineering students. It combines:
- Adaptive learning paths with Bayesian Knowledge Tracing
- Multi-agent AI tutoring system (Tutor, Code Reviewer, Project Generator, Study Coach)
- In-browser code execution (Pyodide/WebContainers)
- RAG-powered knowledge memory (pgvector/ChromaDB)
- Gamified learning (typing race, kanban)
- Durable workflows via Temporal.io

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Browser)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   React 19   │  │  Monaco/WASM │  │  WebGPU/GL   │              │
│  │  + Vite + TS │  │   Editor    │  │  Visualizer  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                        │
│  ┌──────┴─────────────────┴─────────────────┴───────┐              │
│  │              Zustand State Management             │              │
│  │   (Auth, Lab, Agent, Kanban, Theme, Progress)      │              │
│  └──────────────────────┬────────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────────┘
                          │ REST / WebSocket
┌─────────────────────────┼───────────────────────────────────────────┐
│                         │           BACKEND (FastAPI)                │
│  ┌──────────────────────┴────────────────────────────────────┐      │
│  │                   API Gateway (FastAPI)                    │      │
│  │  /api/v1/auth  /api/v1/courses  /api/v1/labs              │      │
│  │  /api/v1/agents  /api/v1/games  /api/v1/progress          │      │
│  └──────┬──────────┬──────────┬──────────┬──────────┬────────┘      │
│         │          │          │          │          │                  │
│  ┌──────┴───┐ ┌────┴────┐ ┌───┴────┐ ┌───┴────┐ ┌───┴─────┐          │
│  │ Adaptive │ │ Multi  │ │ Code   │ │ RAG    │ │ Temporal│          │
│  │ Learning │ │ Agent  │ │ Lab    │ │ Pipeline│ │ Worker  │          │
│  │ Engine   │ │Orchestr│ │ Service│ │        │ │         │          │
│  └────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────┬─────┘          │
│       │           │          │          │           │                 │
│  ┌────┴───────────┴──────────┴──────────┴───────────┴────────┐      │
│  │                     DATA LAYER                             │      │
│  │  PostgreSQL  │  ChromaDB  │  Redis (sessions)  │  Files    │      │
│  └────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture (Browser-First)

### 3.1 Tech Stack
- **Framework**: React 19.2 + TypeScript 6 + Vite 8
- **Styling**: Tailwind CSS 4.3
- **State**: Zustand 5.0 (lightweight, persists to localStorage)
- **Routing**: React Router 7
- **Animations**: Framer Motion 12
- **Code Editor**: Monaco Editor 0.52
- **In-Browser Python**: Pyodide 0.27
- **WebContainers**: @webcontainer/api 1.3
- **ML Visualization**: react-webgpu 0.2 + WebGL

### 3.2 Stores (Zustand)
```
src/stores/
├── aiAgentStore.ts    # AI chat messages, current agent, loading
├── kanbanStore.ts      # Task management, columns, timers
├── labStore.ts        # Code execution, outputs, submissions
├── progressStore.ts   # Course progress, adaptive state
├── authStore.ts        # JWT token, user profile
└── themeStore.ts       # Dark/light mode
```

### 3.3 WebAssembly Compute Zones
| Component | WASM Target | Purpose |
|-----------|-------------|---------|
| Neural Viz | Rust → WASM | Real-timeNN visualization calculations |
| Adaptive Algo | Rust → WASM | BKT inference, difficulty scoring |
| Code Diff | Rust → WASM | Markdown/code diff for reviews |

### 3.4 Advanced UX & Onboarding System (Addressing Complexity)
To ensure the high complexity of the platform remains accessible to users, the frontend implements:
- **Interactive Onboarding (Joyride/Driver.js):** Step-by-step guided tours for new users to introduce the multi-agent system, the BKT concept, and the integrated lab seamlessly.
- **Progressive Disclosure:** Advanced features (like Temporal workflow statuses or deep RAG context views) are hidden by default and progressively revealed as the user's mastery level increases.
- **Design System:** A robust, accessible component library (Storybook integrated) ensuring consistent UI patterns across the complex dashboard.

---

## 4. Backend Architecture

### 4.1 Tech Stack
- **Framework**: FastAPI 0.111 + Uvicorn
- **Database**: PostgreSQL 15 + SQLAlchemy 2.0
- **Vector DB**: ChromaDB 0.5 (RAG memory)
- **AI Integration**: NVIDIA NIM (llama-3.1-70b)
- **Durable Workflows**: Temporal.io
- **Caching**: Redis (sessions)
- **Task Queue**: Celery (async heavy tasks)

### 4.2 Service Layer
```
backend/app/services/
├── nvidia_agent.py        # NVIDIA NIM integration
├── learning_engine.py    # Adaptive learning (BKT)
├── agent_orchestrator.py # Multi-agent coordination
├── rag_pipeline.py        # RAG context retrieval
├── temporal_worker.py     # Durable workflow execution
└── self_improver.py       # Feedback-driven prompt refinement
```

### 4.3 API Routes
```
/api/v1/auth          # JWT authentication
/api/v1/courses       # Learning paths
/api/v1/labs          # Code execution
/api/v1/agents        # Multi-agent chat
/api/v1/games         # Leaderboard, challenges
/api/v1/progress      # Adaptive learning state
/api/v1/projects      # Project generation workflow
/api/v1/rag           # Knowledge base queries
```

---

## 5. Adaptive Learning Engine

### 5.1 Bayesian Knowledge Tracing (BKT)

The BKT model estimates student mastery of each skill/concept:

```
P(Knowledge | Evidence) = P(Knowledge) * P(Evidence | Knowledge)
                          / P(Evidence)

Where:
- P(Knowledge) = prior probability student knows the skill
- P(Evidence | Knowledge) = probability of correct answer given knowledge
- P(Evidence) = probability of observed response
```

### 5.2 Algorithm Pseudocode
```python
class BayesianKnowledgeTracing:
    def __init__(self):
        # Prior probabilities (initialized from cohort data)
        self.p_know = 0.3  # P(Knowledge)
        self.p_guess = 0.25  # P(correct | don't know)
        self.p_slip = 0.10  # P(incorrect | know)
        self.p_learn = 0.20  # P(learning per interaction)

    def update(self, is_correct: bool) -> dict:
        # Prediction before observing
        pred_correct = self.p_know * (1 - self.p_slip) + (1 - self.p_know) * self.p_guess

        # Update posterior
        if is_correct:
            # Evidence = correct
            numerator = self.p_know * (1 - self.p_slip)
        else:
            # Evidence = incorrect
            numerator = self.p_know * self.p_slip

        self.p_know = numerator / pred_correct

        # Apply learning (probability of learning on this interaction)
        self.p_know = self.p_know + self.p_learn * (1 - self.p_know)

        # Difficulty adjustment
        difficulty = self._estimate_difficulty()

        # Suggest remedial or advanced content
        next_action = self._suggest_next(self.p_know, difficulty)

        return {
            "mastery": round(self.p_know, 3),
            "difficulty": difficulty,
            "next_action": next_action,
            "confidence": self._compute_confidence()
        }

    def _estimate_difficulty(self) -> str:
        if self.p_know < 0.3: return "easy"
        elif self.p_know < 0.7: return "medium"
        else: return "hard"
```

### 5.3 Feedback Loop
```
Quiz Response → Score → BKT Update → Mastery Level →
├─ Mastery < 0.5 → Recommend remedial content → RAG retrieve explanations
├─ Mastery 0.5-0.8 → Show hints → Continue practice
└─ Mastery > 0.8 → Advance to next concept → Project Generator suggests application
```

---

## 6. Multi-Agent System Architecture

### 6.1 Agent Personas

| Agent | Role | Tools |
|-------|------|-------|
| **AI Tutor** | Explains concepts, answers questions | RAG (course content), web search |
| **Code Reviewer** | Analyzes code quality, efficiency | Code execution, linting |
| **Project Generator** | Suggests projects based on interests | RAG (project DB), Temporal workflows |
| **Study Coach** | Motivation, scheduling, streak tracking | Progress store, gamification |
| **Lab Assistant** | Python/ML debugging, execution | Pyodide, code execution |

### 6.2 Context Sharing Architecture
```
┌─────────────────────────────────────────────────────────┐
│                   Agent Orchestrator                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Shared Context Memory               │    │
│  │  - Current course/module                         │    │
│  │  - Recent conversation history                    │    │
│  │  - Student mastery levels (BKT state)            │    │
│  │  - Preferred learning style                      │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│         ┌────────────────┼────────────────┐             │
│         ▼                ▼                ▼             │
│  ┌──────────┐    ┌──────────────┐   ┌───────────┐      │
│  │ Tutor    │    │ Code Reviewer│   │ Project   │      │
│  │ Agent    │    │ Agent       │   │ Generator │      │
│  └──────────┘    └──────────────┘   └───────────┘      │
└─────────────────────────────────────────────────────────┘
```

### 6.3 Agent Communication Protocol
```python
# Each agent receives context and returns structured response
class AgentResponse(BaseModel):
    agent_id: str
    content: str
    tool_calls: List[ToolCall]
    confidence: float
    suggested_actions: List[str]
    memory_updates: List[MemoryUpdate]
```

---

## 7. Temporal.io Durable Workflows

### 7.1 Workflow Definitions

**Project Refinement Workflow** (long-running, can pause/resume):
```python
@workflow.defn
class ProjectRefinementWorkflow:
    @workflow.run
    async def run(self, project_id: str) -> ProjectResult:
        # Step 1: Generate initial idea
        idea = await workflow.execute_activity(
            generate_project_idea,
            self.interests,
            start_to_close_timeout=timedelta(minutes=2)
        )

        # Step 2: Wait for student feedback (durable sleep)
        feedback = await workflow.wait_condition(
            lambda: self.feedback_received,
            timeout=timedelta(days=7)
        )

        # Step 3: Refine based on feedback
        refined = await workflow.execute_activity(
            refine_project,
            (idea, feedback),
            start_to_close_timeout=timedelta(minutes=2)
        )

        # Step 4: Create milestone breakdown
        milestones = await workflow.execute_activity(
            create_milestones,
            refined,
            start_to_close_timeout=timedelta(minutes=1)
        )

        return ProjectResult(idea=refined, milestones=milestones)
```

### 7.2 Activity Types
- `generate_project_idea` - Uses NVIDIA NIM + RAG
- `refine_project` - Iterative refinement based on feedback
- `create_milestones` - Break down into weekly tasks
- `analyze_code_submission` - Code review with tests
- `run_adaptive_assessment` - BKT assessment generation

---

## 8. Self-Improving System (The MiniMax Loop)

### 8.1 Feedback Collection
```python
class SelfImprover:
    """Evaluates system suggestions and refines agent prompts."""

    def __init__(self):
        self.feedback_collection = []
        self.prompt_versions = {}

    async def collect_feedback(self, interaction: Interaction):
        """Store interaction outcome for analysis."""
        self.feedback_collection.append({
            "agent_id": interaction.agent_id,
            "prompt": interaction.prompt,
            "response": interaction.response,
            "user_rating": interaction.user_rating,  # 1-5
            "was_helpful": interaction.was_helpful,
            "timestamp": datetime.utcnow()
        })

    async def analyze_and_refine(self):
        """Run nightly analysis to improve prompts."""
        low_rated = [f for f in self.feedback_collection if f["user_rating"] < 3]

        for agent_id in set(f["agent_id"] for f in low_rated):
            agent_feedback = [f for f in low_rated if f["agent_id"] == agent_id]

            # Generate improved system prompt
            new_prompt = await self._generate_improved_prompt(
                agent_id, agent_feedback
            )

            # A/B test: 10% of users get new prompt
            self._deploy_prompt_variant(agent_id, new_prompt, ratio=0.1)

    def _generate_improved_prompt(self, agent_id: str, feedback: list) -> str:
        """Use meta-learning to refine prompts."""
        prompt = f"""Improve this {agent_id} system prompt based on:
        Poorly rated interactions: {feedback}

        Current prompt: {self.prompt_versions.get(agent_id, '')}

        Generate a refined version that addresses:
        1. Specific failure modes in the feedback
        2. Student learning patterns
        3. Clearer explanations
        """
        # Call NVIDIA NIM to generate improved prompt
        ...
```

### 8.2 Prompt Versioning
```python
# Store prompt versions in database
class PromptVersion(BaseModel):
    id: int
    agent_id: str
    prompt_text: str
    version: int
    rollout_percentage: float  # 0.0 to 1.0
    avg_rating: float
    created_at: datetime
    is_active: bool
```

---

## 9. RAG Pipeline

### 9.1 Knowledge Sources
- Course content (textbook chapters, lecture notes)
- Coding problems and solutions
- Project ideas database
- Past student Q&A

### 9.2 Retrieval Flow
```
Query → Embed (NVIDIA) → ChromaDB ANN Search → Top-K Results →
Rerank → Context Window → Agent Response
```

### 9.3 ChromaDB Collections
```
masar_vector_memory/
├── course_content     # Indexed course materials
├── code_snippets      # Solved problems, patterns
├── project_ideas     # Project database
└── student_memory    # Past interactions (encrypted)
```

---

## 10. Data Flow: Student Completing Adaptive Exercise

```
1. Student opens course module
   ↓
2. Frontend requests module + adaptive state
   GET /api/v1/courses/{id}/module/{module_id}
   ↓
3. Backend fetches module content
   + BKT state from progress DB
   + RAG-retrieved relevant explanations
   ↓
4. Frontend renders module + quiz
   ↓
5. Student answers quiz
   POST /api/v1/progress/quiz-submit
   {
     "module_id": "neural-networks-101",
     "question_id": "q5",
     "answer": "backpropagation",
     "is_correct": true,
     "time_spent": 45
   }
   ↓
6. Learning Engine updates BKT:
   - Calculate new mastery probability
   - Determine if remedial content needed
   - Update suggested difficulty
   ↓
7. Response:
   {
     "is_correct": true,
     "mastery": 0.72,
     "difficulty": "medium",
     "next_action": "continue",
     "hint": null,
     "remedial_content": null
   }
   ↓
8. If mastery < threshold (< 0.5):
   - Trigger RAG retrieval for explanation
   - Suggest review material
   - Adjust future quiz difficulty
   ↓
9. Progress persisted to PostgreSQL
   + Student memory updated in ChromaDB
```

---

## 11. Performance & Optimization

### 11.1 Rust/WASM Components

| Module | WASM Binary | Purpose |
|--------|-------------|---------|
| `neural-viz-wasm` | `neural_viz.wasm` | Matrix ops for NN visualization |
| `bkt-core` | `bkt_core.wasm` | Fast BKT inference |
| `diff-engine` | `diff_engine.wasm` | Code/markdown diff |

### 11.2 WebGPU for ML Visualizations
- Real-time gradient descent visualization
- Neural network activation maps
- Embedding space explorer

### 11.3 Multi-Tier Caching & Performance Strategy
To mitigate the high resource consumption of LLMs and Vector DBs, a rigorous caching strategy is applied:
```
Tier 1 (Client): Zustand (memory) + IndexedDB (persisted local storage for WASM modules & code state)
         ↓
Tier 2 (Edge): CDN (Cloudflare) for static assets, WASM binaries, and compiled WebGPU shaders
         ↓
Tier 3 (Semantic Cache): Redis + GPTCache (Caches exact or semantically similar LLM queries to bypass NIM API calls, reducing cost by up to 60%)
         ↓
Tier 4 (Database): PostgreSQL (persistent state)
```

---

## 12. Security

- JWT tokens (HS256) with 24hr expiry
- RLS (Row Level Security) on PostgreSQL
- ChromaDB collections encrypted at rest
- NVIDIA API key via environment variables only
- CORS restricted to frontend origin
- Rate limiting on all API endpoints

---

## 13. Enterprise Operations & Scalability (10/10 Readiness)

To address the high complexity and resource demands of the multi-agent AI and vector database stack, the project employs enterprise-grade operational patterns:

### 13.1 Kubernetes & Auto-scaling
- **Orchestration:** Deployed on Kubernetes (EKS/GKE) using Helm charts.
- **Auto-scaling:**
  - KEDA (Kubernetes Event-driven Autoscaling) configured to scale Temporal workers based on queue length.
  - Horizontal Pod Autoscaler (HPA) for FastAPI pods based on CPU and memory usage, ensuring AI inference workloads are handled efficiently.
- **GPU Node Pools:** Dedicated Kubernetes node pools with NVIDIA GPUs for heavy local AI tasks (if not relying entirely on NVIDIA NIM APIs).

### 13.2 CI/CD Pipeline (GitHub Actions)
- **Automated Testing:** Unit, integration, and End-to-End (Playwright) tests run on every Pull Request.
- **WASM Builds:** Automated Rust compilation to WebAssembly ensuring frontend payloads are always optimized.
- **Automated Deployment:** GitOps workflow using ArgoCD to sync repository state with the Kubernetes cluster.

### 13.3 Observability & Monitoring
- **Metrics:** Prometheus scrapes metrics from FastAPI, Temporal, and Postgres.
- **Dashboards:** Grafana provides real-time visibility into BKT algorithm efficiency, AI agent response times, and system resource utilization.
- **Tracing:** OpenTelemetry distributed tracing across the frontend, FastAPI gateway, Temporal workflows, and AI Agents to easily debug multi-step workflows.

## 14. Deployment

### 14.1 Docker Compose Services (Local Development)
```yaml
services:
  backend:      # FastAPI + all services
  frontend:     # React + Vite
  db:           # PostgreSQL 15
  chroma:       # ChromaDB vector DB
  redis:        # Session cache
  temporal:     # Temporal server + UI
  worker:       # Temporal Python worker
```

### 13.2 Environment Variables
```
# Backend
DATABASE_URL=postgresql://postgres:postgres@db:5432/masar
REDIS_URL=redis://redis:6379
TEMPORAL_HOST=temporal:7233
NVIDIA_API_KEY=nvapi-xxx
CHROMA_HOST=chroma

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

---

## 14. File Structure

```
masar-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── agents.py
│   │   │   ├── courses.py
│   │   │   ├── games.py
│   │   │   ├── labs.py
│   │   │   ├── progress.py      # NEW: Adaptive learning
│   │   │   └── projects.py       # NEW: Project workflow
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── course.py
│   │   │   ├── progress.py
│   │   │   ├── submission.py
│   │   │   └── feedback.py       # NEW: Self-improvement
│   │   ├── services/
│   │   │   ├── nvidia_agent.py
│   │   │   ├── learning_engine.py    # NEW: BKT
│   │   │   ├── agent_orchestrator.py # NEW
│   │   │   ├── rag_pipeline.py        # NEW
│   │   │   ├── temporal_worker.py     # NEW
│   │   │   └── self_improver.py       # NEW
│   │   └── main.py
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── temporal.ts     # NEW: Temporal client
│   │   │   └── wasm.ts          # NEW: WASM loader
│   │   ├── stores/
│   │   ├── types/
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── shared/
│   └── types/                    # Shared TypeScript/Python types
├── temporal/
│   ├── workflows.py              # Workflow definitions
│   ├── activities.py             # Activity handlers
│   └── worker.py                 # Worker entry point
├── wasm/                         # Rust WASM source
│   ├── bkt_core/
│   └── neural_viz/
└── MASAR-ARCHITECTURE.md
```

---

## 15. Integration Checklist

- [x] React Frontend (Kimi K2.6 output)
- [x] FastAPI Backend (GLM 5.1 output)
- [ ] Adaptive Learning Engine (BKT)
- [ ] Multi-Agent Orchestrator
- [ ] RAG Pipeline with ChromaDB
- [ ] Temporal.io Worker
- [ ] Self-Improving System
- [ ] WebGPU Visualization Service
- [ ] Rust/WASM Components
- [ ] Updated docker-compose
- [ ] Integration Tests

---

*Last Updated: 2026-01-09*
*Version: 2.0*