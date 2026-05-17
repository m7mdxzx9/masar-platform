# Masar Platform - Project Map & Execution Timeline

## Project Vision
"Masar" (Mohammed Daghriri Platform) is an advanced AI learning ecosystem designed for university AI engineering students. It combines academic theory with practical execution through interactive labs, multi-agent AI tutoring, and gamified learning paths.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Backend | Python + FastAPI |
| Database | PostgreSQL + ChromaDB (vector memory) |
| AI/LLM | NVIDIA NIM / AI Endpoints |
| Editor | Monaco Editor |
| Neural Sim | WebAssembly + WebGL |

---

## Design System: "Neon Academic"
Merged style: Minimalist Tech (base) + Bold Academic (hierarchy) + Playful Cyberpunk (interactive accents)

- **Backgrounds:** Deep charcoal (#0F172A, #1E293B)
- **Primary Text:** Crisp white (#F8FAFC)
- **Accent (Interactive):** Royal Blue (#2400FF) to Cyan (#00FFFF) gradient
- **Success:** Neon Green (#00FF88)
- **Error:** Neon Red (#FF4466)
- **Glow Effects:** Cyan/Blue for active elements, Magenta (#FF00FF) for gamification
- **Typography:** Inter (UI), JetBrains Mono (code sections), Merriweather (academic headers)

---

## Folder Structure

```
masar-platform/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── features/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── main.tsx
│   ├── public/
│   ├── index.html
│   └── package.json
├── shared/types/
└── project_map.md
```

---

## Execution Timeline & Task Status

| # | Module | Priority | Status | Estimated Time |
|---|--------|----------|--------|---------------|
| 1 | Project Scaffolding (Vite + FastAPI + Tailwind) | **CRITICAL** | IN PROGRESS | 30 min |
| 2 | Project Map & Architecture | **CRITICAL** | IN PROGRESS | 15 min |
| 3 | Core Layout (Navbar, Sidebar, Dashboard) | **CRITICAL** | PENDING | 45 min |
| 4 | Authentication (Pages + API) | HIGH | PENDING | 30 min |
| 5 | Monaco Code Editor | HIGH | PENDING | 45 min |
| 6 | Neural Network Simulator (Wasm/WebGL) | HIGH | PENDING | 60 min |
| 7 | Multi-Agent System (NVIDIA API) | HIGH | PENDING | 60 min |
| 8 | Learning Paths | MEDIUM | PENDING | 45 min |
| 9 | Gamification Engine (Letter Racing) | MEDIUM | PENDING | 45 min |
| 10 | Response Design & Polish | MEDIUM | PENDING | 30 min |

---

## Completed Tasks Log
-[2025-05-08] Initialized project structure and created project_map.md

---

## Architecture Notes

### Frontend:
- Vite + React w/ TypeScript
- Tailwind CSS for all styling (no inline styles)
- Zustand for state management (lightweight)
- React Router for navigation

### Backend:
- FastAPI with CORS enabled
- Pydantic for data validation
- SQLAlchemy + Alembic for PostgreSQL
- ChromaDB for vector memory storage
- NVIDIA AI Endpoints for multi-agent LLM calls

### API Structure:
- `/api/v1/auth` - Authentication
- `/api/v1/users` - User profiles
- `/api/v1/courses` - Course content & learning paths
- `/api/v1/labs` - Code execution & simulation
- `/api/v1/agents` - Multi-agent system interactions
- `/api/v1/games` - Gamification challenges & scores

### Database Schema (PostgreSQL):
- Users (id, username, email, password_hash, created_at)
- Courses (id, title, description, modules, difficulty)
- Progress (id, user_id, course_id, module_id, completed_at, score)
- Submissions (id, user_id, lab_id, code, output, passed_tests, submitted_at)
- Leaderboard (user_id, score, rank, updated_at)

---

## Design Tokens (CSS Variables)

```css
:root {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --text-primary: #F8FAFC;
  --accent-blue: #2400FF;
  --accent-cyan: #00FFFF;
  --accent-magenta: #FF00FF;
  --success: #00FF88;
  --error: #FF4466;
  --font-ui: 'Inter', sans-serif;
  --font-code: 'JetBrains Mono', monospace;
  --font-header: 'Merriweather', serif;
}
```

---
