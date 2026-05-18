"""
Adaptive Learning Engine - Bayesian Knowledge Tracing (BKT)

تقدير إتقان الطالب لكل مهارة بناءً على إجاباته،
وتحديد مستوى الصعوبة التالي والإجراء المقترح.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class BKTParams:
    """معاملات نموذج BKT الافتراضية (يمكن معايرتها لكل مهارة)."""
    p_init: float = 0.30   # P(L0) - الاحتمال الأولي للمعرفة
    p_learn: float = 0.20  # P(T) - احتمال التعلم في كل تفاعل
    p_guess: float = 0.25  # P(G) - احتمال التخمين الصحيح
    p_slip: float = 0.10   # P(S) - احتمال الزلل رغم المعرفة


@dataclass
class BKTState:
    """حالة الإتقان لمهارة واحدة."""
    skill_id: str
    p_know: float = 0.30
    attempts: int = 0
    correct: int = 0
    params: BKTParams = field(default_factory=BKTParams)


class BayesianKnowledgeTracing:
    """تنفيذ BKT المعياري مع تحديث الاحتمالية اللاحقة."""

    @staticmethod
    def update(state: BKTState, is_correct: bool) -> BKTState:
        p = state.params
        prior = max(min(state.p_know, 1.0), 0.0)

        if is_correct:
            num = prior * (1 - p.p_slip)
            den = num + (1 - prior) * p.p_guess
        else:
            num = prior * p.p_slip
            den = num + (1 - prior) * (1 - p.p_guess)

        posterior = num / den if den > 0 else prior
        # تطبيق احتمال التعلم
        new_know = posterior + (1 - posterior) * p.p_learn

        state.p_know = round(min(max(new_know, 0.0), 1.0), 4)
        state.attempts += 1
        if is_correct:
            state.correct += 1
        return state

    @staticmethod
    def mastery_level(p_know: float) -> str:
        if p_know < 0.4:
            return "beginner"
        if p_know < 0.7:
            return "intermediate"
        if p_know < 0.9:
            return "advanced"
        return "mastered"

    @staticmethod
    def difficulty(p_know: float) -> str:
        if p_know < 0.3:
            return "easy"
        if p_know < 0.7:
            return "medium"
        return "hard"

    @staticmethod
    def next_action(p_know: float, time_spent: Optional[float] = None) -> str:
        if p_know < 0.5:
            return "remedial"      # محتوى علاجي
        if p_know < 0.8:
            return "practice"      # المزيد من التمارين
        return "advance"           # الانتقال للمفهوم التالي


def evaluate_attempt(
    current_p_know: float,
    is_correct: bool,
    skill_id: str,
    attempts: int = 0,
    correct: int = 0,
    time_spent: Optional[float] = None,
) -> dict:
    """دالة مساعدة عالية المستوى لاستخدامها من طبقة الـ API."""
    state = BKTState(
        skill_id=skill_id,
        p_know=current_p_know if current_p_know > 0 else BKTParams().p_init,
        attempts=attempts,
        correct=correct,
    )
    state = BayesianKnowledgeTracing.update(state, is_correct)
    return {
        "skill_id": state.skill_id,
        "mastery": state.p_know,
        "mastery_level": BayesianKnowledgeTracing.mastery_level(state.p_know),
        "difficulty": BayesianKnowledgeTracing.difficulty(state.p_know),
        "next_action": BayesianKnowledgeTracing.next_action(state.p_know, time_spent),
        "attempts": state.attempts,
        "correct": state.correct,
        "accuracy": round(state.correct / state.attempts, 3) if state.attempts else 0.0,
    }
