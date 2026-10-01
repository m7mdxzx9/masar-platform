import { create } from "zustand";
import { persist } from "zustand/middleware";
import { goalsAPI } from "@/services/api";

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  target: number;
  current: number;
  target_type: string;
  deadline: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
  is_local_only?: boolean;
  has_local_changes?: boolean;
}

interface GoalsState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (data: {
    title: string;
    description?: string;
    target?: number;
    target_type?: string;
    deadline?: string;
  }) => Promise<void>;
  updateGoal: (
    id: number,
    data: {
      title?: string;
      description?: string;
      target?: number;
      current?: number;
      target_type?: string;
      deadline?: string;
      completed?: boolean;
    },
  ) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],
      isLoading: false,
      error: null,

      fetchGoals: async () => {
        set({ isLoading: true, error: null });
        if (localStorage.getItem("masar-cloud-config")) {
          set({ isLoading: false });
          return;
        }
        try {
          const { data } = await goalsAPI.list();
          const localGoals = get().goals.filter(
            (goal) => goal.is_local_only || goal.has_local_changes,
          );
          const localIds = new Set(localGoals.map((goal) => goal.id));
          set({
            goals: [...localGoals, ...(data as Goal[]).filter((goal) => !localIds.has(goal.id))],
            isLoading: false,
          });
        } catch (err: any) {
          console.warn("[GoalsStore] Backend fetch error, keeping local goals:", err);
          set({
            isLoading: false,
            error: "تعذر الاتصال بالخادم. تظهر الأهداف المحفوظة على هذا الجهاز.",
          });
        }
      },

      createGoal: async (data) => {
        set({ error: null });
        if (!localStorage.getItem("masar-cloud-config"))
          try {
            const response = await goalsAPI.create(data);
            const goal = { ...response.data, is_local_only: false } as Goal;
            set((s) => ({ goals: [goal, ...s.goals] }));
            return;
          } catch {
            // Keep a separate local record when the server cannot accept the goal.
          }
        const newGoal: Goal = {
          id: -Date.now() - Math.floor(Math.random() * 1000),
          title: data.title,
          description: data.description || null,
          target: data.target || 1,
          current: 0,
          target_type: data.target_type || "hours",
          deadline: data.deadline || null,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_local_only: !localStorage.getItem("masar-cloud-config"),
        };
        set((s) => ({
          goals: [newGoal, ...s.goals],
          error: localStorage.getItem("masar-cloud-config")
            ? null
            : "تعذر حفظ الهدف على الخادم. حُفظ على هذا الجهاز فقط.",
        }));
      },

      updateGoal: async (id, data) => {
        const existing = get().goals.find((goal) => goal.id === id);
        if (!existing) return;
        set({ error: null });
        let changes: Partial<Goal> = { ...data, updated_at: new Date().toISOString() };
        if (!existing.is_local_only && !localStorage.getItem("masar-cloud-config")) {
          try {
            const response = await goalsAPI.update(id, data);
            changes = { ...response.data, is_local_only: false, has_local_changes: false };
          } catch {
            changes.has_local_changes = true;
            set({ error: "تعذر تحديث الخادم. حُفظ التعديل على هذا الجهاز فقط." });
          }
        }
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, ...changes } : g)),
        }));
      },

      deleteGoal: async (id) => {
        const existing = get().goals.find((goal) => goal.id === id);
        if (!existing) return;
        set({ error: null });
        if (!existing.is_local_only && !localStorage.getItem("masar-cloud-config")) {
          try {
            await goalsAPI.delete(id);
          } catch {
            set({ error: "تعذر حذف الهدف من الخادم. حاول مجددًا عند توفر الاتصال." });
            return;
          }
        }
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
      },
    }),
    { name: "masar-goals", partialize: (state) => ({ goals: state.goals }) },
  ),
);
