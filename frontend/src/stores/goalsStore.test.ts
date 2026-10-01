import { beforeEach, describe, expect, it, vi } from "vitest";
import { goalsAPI } from "@/services/api";
import { useGoalsStore, type Goal } from "./goalsStore";

vi.mock("@/services/api", () => ({
  goalsAPI: { list: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

const serverGoal: Goal = {
  id: 42,
  title: "Study",
  description: null,
  target: 10,
  current: 0,
  target_type: "hours",
  deadline: null,
  completed: false,
  created_at: "2026-10-01T10:00:00Z",
  updated_at: "2026-10-01T10:00:00Z",
};

describe("goal saving and offline persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    useGoalsStore.setState({ goals: [], isLoading: false, error: null });
  });

  it("keeps goals editable through the cloud workspace without calling the legacy API", async () => {
    localStorage.setItem("masar-cloud-config", "{}");
    await useGoalsStore.getState().createGoal({ title: "Cloud goal" });
    const id = useGoalsStore.getState().goals[0].id;
    await useGoalsStore.getState().updateGoal(id, { current: 1 });
    await useGoalsStore.getState().fetchGoals();
    expect(useGoalsStore.getState().goals[0].current).toBe(1);
    expect(useGoalsStore.getState().error).toBeNull();
    await useGoalsStore.getState().deleteGoal(id);
    expect(useGoalsStore.getState().goals).toHaveLength(0);
    expect(goalsAPI.create).not.toHaveBeenCalled();
    expect(goalsAPI.update).not.toHaveBeenCalled();
    expect(goalsAPI.list).not.toHaveBeenCalled();
    expect(goalsAPI.delete).not.toHaveBeenCalled();
  });

  it("uses the server ID for subsequent progress updates", async () => {
    vi.mocked(goalsAPI.create).mockResolvedValue({ data: serverGoal } as never);
    vi.mocked(goalsAPI.update).mockResolvedValue({ data: { ...serverGoal, current: 3 } } as never);
    await useGoalsStore.getState().createGoal({ title: "Study" });
    expect(useGoalsStore.getState().goals[0].id).toBe(42);
    await useGoalsStore.getState().updateGoal(useGoalsStore.getState().goals[0].id, { current: 3 });
    expect(goalsAPI.update).toHaveBeenCalledWith(42, { current: 3 });
    expect(useGoalsStore.getState().goals[0].current).toBe(3);
  });

  it("rehydrates offline goals and retains them during server refresh", async () => {
    vi.mocked(goalsAPI.create).mockRejectedValue(new Error("offline"));
    await useGoalsStore.getState().createGoal({ title: "Local study" });
    const localGoal = useGoalsStore.getState().goals[0];
    expect(localGoal.is_local_only).toBe(true);
    expect(useGoalsStore.getState().error).toContain("هذا الجهاز فقط");
    const saved = localStorage.getItem("masar-goals")!;
    useGoalsStore.setState({ goals: [] });
    localStorage.setItem("masar-goals", saved);
    await useGoalsStore.persist.rehydrate();
    expect(useGoalsStore.getState().goals).toEqual([localGoal]);
    vi.mocked(goalsAPI.list).mockResolvedValue({ data: [serverGoal] } as never);
    await useGoalsStore.getState().fetchGoals();
    expect(useGoalsStore.getState().goals.map((goal) => goal.id)).toEqual([localGoal.id, 42]);
    await useGoalsStore.getState().updateGoal(localGoal.id, { current: 1 });
    expect(goalsAPI.update).not.toHaveBeenCalled();
    await useGoalsStore.getState().deleteGoal(localGoal.id);
    expect(goalsAPI.delete).not.toHaveBeenCalled();
  });

  it("keeps unsynced progress when the server returns stale data", async () => {
    useGoalsStore.setState({ goals: [serverGoal] });
    vi.mocked(goalsAPI.update).mockRejectedValue(new Error("offline"));
    await useGoalsStore.getState().updateGoal(42, { current: 4 });
    vi.mocked(goalsAPI.list).mockResolvedValue({ data: [serverGoal] } as never);
    await useGoalsStore.getState().fetchGoals();
    expect(useGoalsStore.getState().goals).toHaveLength(1);
    expect(useGoalsStore.getState().goals[0].current).toBe(4);
    expect(useGoalsStore.getState().goals[0].has_local_changes).toBe(true);
  });

  it("retains server goals when deletion fails", async () => {
    useGoalsStore.setState({ goals: [serverGoal] });
    vi.mocked(goalsAPI.delete).mockRejectedValue(new Error("offline"));
    await useGoalsStore.getState().deleteGoal(42);
    expect(useGoalsStore.getState().goals).toEqual([serverGoal]);
    expect(useGoalsStore.getState().error).toContain("تعذر حذف");
  });
});
