# MASAR Platform - Integration Plan v3.0
## Decision Document: Resolving Codebase Conflicts

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue 1: Frontend is 90% Deleted
**Severity: CRITICAL**

| Missing File | Impact |
|--------------|--------|
| `src/main.tsx` | App cannot start |
| `src/App.tsx` | No routing |
| `src/pages/*.tsx` | All pages missing |
| `src/components/lab/*.tsx` | Smart Lab dead |

**Decision**: Regenerate entire frontend application structure.

---

### Issue 2: Smart Lab is Non-Functional
**Severity: CRITICAL**

Current state:
- Frontend calls `/api/v1/labs/execute`
- Backend `labs.py` has broken execution (exec in same process)
- No Pyodide integration
- No Monaco Editor integration
- Code editor is literally `<textarea>`

**Decision**: Implement **Pyodide-in-Browser** architecture (2026 standard)

```
Architecture: Client-Side Execution
┌─────────────────────────────────────────────────────┐
│ BROWSER                                                │
│  ┌─────────────┐    ┌─────────────┐                  │
│  │ Monaco      │───▶│ Pyodide     │                  │
│  │ Editor      │    │ WASM        │                  │
│  └─────────────┘    └─────────────┘                  │
│         │                  │                          │
│         └──────────────────┴──▶ Output               │
└─────────────────────────────────────────────────────┘
         │ No backend execution needed
         ▼
   [DELETE] backend /labs/execute
```

---

### Issue 3: Duplicate Agent Systems
**Severity: HIGH**

| System | File | Architecture | Tools |
|--------|------|--------------|-------|
| **GLM's** | `agent_service.py` | LangGraph + ToolNode | RAG, search, code执行 |
| **MiniMax's** | `nvidia_agent.py` | Simple async chat | None |

**Decision**: **KEEP GLM's system** (LangGraph is production-ready with tools)

**Action**: Delete `services/nvidia_agent.py` and `services/agent_orchestrator.py` (MiniMax's)

**Action**: Keep `services/learning_engine.py` (BKT is separate from agent chat)

---

### Issue 4: API Schema Mismatch
**Severity: HIGH**

Frontend `api.ts` sends:
```typescript
{ message, agent_type }  // MISSING: conversation_history
```

GLM Backend expects (from `ChatRequest`):
```python
{ message: str, agent_type: str, conversation_history: list[dict] }
```

**Decision**: Fix frontend `api.ts` to match backend schema.

---

### Issue 5: Vite Build Errors
**Severity: HIGH**

Current `vite.config.ts`:
```typescript
import tailwindcss from '@tailwindcss/vite'  // WRONG for Tailwind v4
```

Tailwind CSS v4 does NOT use a Vite plugin - it uses PostCSS.

**Decision**: Fix vite.config.ts and ensure proper PostCSS setup.

---

### Issue 6: Proxy Target Wrong
**Severity: MEDIUM**

```typescript
proxy: { '/api': { target: 'http://localhost:8001' } }  // 8001 WRONG
```

Backend runs on port **8000**, not 8001.

---

### Issue 7: Model Conflicts
**Severity: MEDIUM**

| MiniMax Model | GLM Model | Conflict |
|---------------|-----------|----------|
| `SkillMastery` (feedback.py) | `Progress` (models.py) | Same purpose |

**Decision**: Keep GLM's `Progress` model. Merge BKT-specific fields into Progress or create `SkillMastery` that extends with BKT state.

---

### Issue 8: Missing Backend Routes
**Severity: MEDIUM**

MiniMax added routes in `main.py`:
- `/progress/*` - adaptive learning
- `/projects/*` - workflow

But these endpoints don't fully exist or are stubs.

**Decision**: Complete implementation of these routes.

---

## 📋 DECISIONS SUMMARY

| Issue | Decision |
|-------|----------|
| Frontend structure | **REGENERATE** complete React app |
| Smart Lab | **Pyodide-in-Browser** (delete backend execution) |
| Agent system | **KEEP GLM's LangGraph** (delete MiniMax's simple version) |
| API schema | **FIX frontend** to match backend |
| Vite/Tailwind | **Use PostCSS** (not @tailwindcss/vite) |
| Proxy port | **CHANGE to 8000** |
| Models | **KEEP GLM's Progress**, extend for BKT |
| Backend routes | **COMPLETE** progress and projects routes |

---

## 🏗️ UNIFIED ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React 19)                          │
│                                                                       │
│  Pages: Dashboard | Learning | Labs | Agents | Challenges | Kanban   │
│                                                                       │
│  Smart Lab (Pyodide):                                                │
│    ┌──────────────┐     ┌──────────────┐                             │
│    │ Monaco       │────▶│ Pyodide WASM │                             │
│    │ Editor       │     │ (in browser) │                             │
│    └──────────────┘     └──────────────┘                             │
│                                                                       │
│  State: Zustand (auth, progress, lab, agents, kanban)               │
└─────────────────────────────────────────────────────────────────────┘
                              │ REST + SSE
┌─────────────────────────────┴───────────────────────────────────────┐
│                          BACKEND (FastAPI)                           │
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │ Auth        │  │ Courses      │  │ Agents (LangGraph)          │ │
│  │ /auth/*     │  │ /courses/*  │  │ /agents/chat (SSE)          │ │
│  └─────────────┘  └─────────────┘  │ - Uses tools               │ │
│                                    │ - RAG integration           │ │
│  ┌─────────────┐  ┌─────────────┐  │ - Streaming response       │ │
│  │ Games       │  │ Labs        │  └─────────────────────────────┘ │
│  │ /games/*    │  │ /labs/*     │                                 │
│  └─────────────┘  │ (STUB only) │  ┌─────────────────────────────┐ │
│                   └─────────────┘  │ Progress (BKT)              │ │
│                                    │ /progress/*                 │ │
│  ┌─────────────┐  ┌─────────────┐  │ - Mastery tracking         │ │
│  │ Projects    │  │ Knowledge   │  │ - Adaptive recommendations │ │
│  │ /projects/* │  │ /knowledge/*│  └─────────────────────────────┘ │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────┴───────────────────────────────────────┐
│                          DATA LAYER                                  │
│  PostgreSQL (courses, progress, submissions, users)                  │
│  pgvector (embeddings for RAG)                                       │
│  ChromaDB (document chunks - optional alternative)                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 FILES TO DELETE

```bash
# MiniMax's duplicate agent system
backend/app/services/nvidia_agent.py
backend/app/services/agent_orchestrator.py
backend/app/services/rag_pipeline.py
backend/app/services/self_improver.py
backend/app/services/workflows.py
backend/app/services/activities.py
backend/app/services/temporal_worker.py

# MiniMax's feedback models (keeping GLM's models)
backend/app/models/feedback.py

# MiniMax's API routes (keeping GLM's)
backend/app/api/progress.py    # Rewrite with unified models
backend/app/api/projects.py    # Rewrite with unified models
```

---

## 📁 FILES TO CREATE/MODIFY

### Frontend (Complete Regeneration)
```
frontend/src/
├── main.tsx                          # [CREATE]
├── App.tsx                           # [CREATE]
├── index.css                         # [MODIFY] - fix Tailwind imports
├── vite.config.ts                     # [MODIFY] - fix PostCSS
├── pages/
│   ├── DashboardPage.tsx             # [CREATE]
│   ├── LearningPage.tsx              # [CREATE]
│   ├── LabsPage.tsx                  # [CREATE] - Pyodide integration
│   ├── AgentsPage.tsx                # [CREATE]
│   ├── ChallengesPage.tsx           # [CREATE]
│   └── KanbanPage.tsx                # [CREATE]
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx               # [CREATE]
│   │   └── PageLayout.tsx            # [CREATE]
│   ├── ui/
│   │   ├── Button.tsx                # [CREATE]
│   │   ├── Card.tsx                  # [CREATE]
│   │   └── Badge.tsx                 # [CREATE]
│   └── lab/
│       ├── PyodideRunner.tsx         # [CREATE] - KEY COMPONENT
│       └── MonacoEditor.tsx          # [CREATE] - Monaco wrapper
├── services/
│   └── api.ts                         # [MODIFY] - fix schema
└── stores/
    ├── labStore.ts                    # [CREATE] - lab state
    └── progressStore.ts               # [CREATE] - BKT state
```

### Backend (Selective Fixes)
```
backend/app/
├── services/
│   └── learning_engine.py            # [KEEP] - BKT engine
├── api/
│   ├── progress.py                   # [REWRITE] - unified with GLM models
│   └── projects.py                   # [REWRITE] - unified with GLM models
├── main.py                           # [MODIFY] - remove MiniMax routes
└── requirements.txt                  # [MODIFY] - remove temporalio if unused
```

---

## 🔧 SMART LAB IMPLEMENTATION

### Pyodide Runner (Browser-Side Execution)

```typescript
// src/components/lab/PyodideRunner.tsx
// Complete implementation with:
1. Dynamic Pyodide WASM loading
2. stdout/stderr capture
3. Async execution
4. Cleanup between runs
```

### Monaco Editor Integration

```typescript
// src/components/lab/MonacoEditor.tsx
// Complete implementation with:
1. Python language support
2. Dark theme matching Masar design
3. Basic autocomplete
4. Error highlighting
```

---

## 🚀 STEP-BY-STEP EXECUTION PLAN

### Phase 1: Fix Build (Critical)
1. Fix `vite.config.ts` (remove @tailwindcss/vite, use PostCSS)
2. Fix `index.css` (Tailwind v4 syntax)
3. Test `npm run build`

### Phase 2: Restore Frontend Structure
1. Create `main.tsx`
2. Create `App.tsx` with React Router
3. Create all pages (Dashboard, Learning, Labs, Agents, Challenges, Kanban)
4. Create layout components (Sidebar, PageLayout)
5. Create UI components (Button, Card, Badge)

### Phase 3: Implement Smart Lab
1. Create `PyodideRunner.tsx` (in-browser Python)
2. Create `MonacoEditor.tsx` (code editor)
3. Update `LabsPage.tsx` (integrate both)
4. Delete backend `/labs/execute` endpoint

### Phase 4: Unify Agent System
1. Delete `nvidia_agent.py`
2. Delete `agent_orchestrator.py`
3. Keep `agent_service.py` (GLM's LangGraph version)
4. Fix `api.ts` to match GLM's ChatRequest schema

### Phase 5: Unify Models
1. Keep GLM's `Progress` model
2. Extend it with BKT fields (or create unified progress endpoint)
3. Delete MiniMax's `feedback.py` SkillMastery model

### Phase 6: Complete Backend Routes
1. Rewrite `/progress/*` endpoints using GLM models
2. Rewrite `/projects/*` endpoints using GLM models
3. Test all endpoints

### Phase 7: Integration Test
1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Test full flow: login → course → lab → agent chat

---

## ✅ VERIFICATION CHECKLIST

- [ ] `npm run build` succeeds
- [ ] Frontend loads at http://localhost:5173
- [ ] All pages render (Dashboard, Learning, Labs, etc.)
- [ ] Pyodide executes Python in browser
- [ ] Monaco Editor loads with Python support
- [ ] Agent chat streams via SSE
- [ ] RAG knowledge retrieval works
- [ ] Progress tracking stores data
- [ ] No console errors on pages

---

*Document Version: 3.0*
*Last Updated: 2026-01-09*
*Status: APPROVED FOR EXECUTION*