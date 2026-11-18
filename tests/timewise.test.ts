import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveWorkspace,
  loadStorageState,
  loginStudentAccount,
  logoutSession,
  registerStudentAccount,
  resetDemoWorkspace,
  resetPersonalWorkspace,
  startDemoSession,
  switchStudentAccount,
  updateActiveWorkspace,
} from "../lib/storage";
import { hashPasswordPrototype } from "../lib/auth/crypto";
import {
  calculateFocusAnalytics,
  calculatePlanningAccuracy,
  calculateTaskCompletionMetrics,
  resolveDateRangeBounds,
} from "../lib/analytics";
import { generateRuleBasedStudyPlan } from "../lib/ai/rule-engine";
import { formatLocalDate } from "../lib/utils";

describe("TIMEWISE Core Architecture & Acceptance Suite", () => {
  beforeEach(() => {
    // Reset in-memory / localStorage state before each test
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("1. Hashes passwords so plaintext passwords are never stored", async () => {
    const plain = "SuperSecretStudentPass123!";
    const digest = await hashPasswordPrototype(plain);
    expect(digest).not.toBe(plain);
    expect(digest.includes(plain)).toBe(false);
    expect(digest.length).toBeGreaterThan(12);
  });

  it("2. Isolates multiple student workspaces and protects them during account switching & resets", async () => {
    const hashA = await hashPasswordPrototype("passA123");
    const hashB = await hashPasswordPrototype("passB123");

    const { student: studentA } = registerStudentAccount({
      fullName: "Student Alpha",
      email: "alpha@uni.edu",
      passwordHash: hashA,
      academicLevel: "undergraduate",
      dailyStudyGoalMinutes: 120,
    });

    // Add a task to Student Alpha's workspace
    updateActiveWorkspace((ws, userId) => ({
      ...ws,
      tasks: [
        {
          id: "task_alpha_1",
          userId,
          title: "Alpha Private Calculus Task",
          subjectId: ws.subjects[0].id,
          priority: "high",
          status: "not-started",
          deadline: "2026-12-01",
          estimatedMinutes: 60,
          actualMinutes: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    // Register Student Beta
    const { student: studentB, state: stateAfterB } = registerStudentAccount({
      fullName: "Student Beta",
      email: "beta@uni.edu",
      passwordHash: hashB,
      academicLevel: "postgraduate",
      dailyStudyGoalMinutes: 180,
    });

    const activeB = getActiveWorkspace(stateAfterB);
    expect(activeB?.userId).toBe(studentB.id);
    expect(activeB?.workspace.tasks.length).toBe(0);

    // Add task to Student Beta
    updateActiveWorkspace((ws, userId) => ({
      ...ws,
      tasks: [
        {
          id: "task_beta_1",
          userId,
          title: "Beta Thesis Literature Review",
          subjectId: ws.subjects[0].id,
          priority: "medium",
          status: "in-progress",
          deadline: "2026-12-05",
          estimatedMinutes: 120,
          actualMinutes: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    }));

    // Switch back to Student Alpha and verify isolation
    const stateSwitchedA = switchStudentAccount(studentA.id);
    const activeA = getActiveWorkspace(stateSwitchedA);
    expect(activeA?.workspace.tasks.length).toBe(1);
    expect(activeA?.workspace.tasks[0].title).toBe("Alpha Private Calculus Task");

    // Resetting Demo Workspace must NOT affect Student Alpha or Student Beta
    resetDemoWorkspace();
    const reloaded = loadStorageState();
    expect(reloaded.student_workspaces[studentA.id].tasks.length).toBe(1);
    expect(reloaded.student_workspaces[studentB.id].tasks.length).toBe(1);

    // Resetting Student Alpha's personal workspace must NOT affect Student Beta
    resetPersonalWorkspace(studentA.id);
    const afterAlphaReset = loadStorageState();
    expect(afterAlphaReset.student_workspaces[studentA.id].tasks.length).toBe(0);
    expect(afterAlphaReset.student_workspaces[studentB.id].tasks.length).toBe(1);

    // Login & Logout verification
    logoutSession();
    expect(loadStorageState().active_session).toBeNull();
    const { student: loggedInB } = loginStudentAccount("beta@uni.edu", hashB);
    expect(loggedInB.id).toBe(studentB.id);
  });

  it("3. Preloads Shared Demo Workspace with sample data and resets cleanly", () => {
    const state = startDemoSession();
    const activeDemo = getActiveWorkspace(state);
    expect(activeDemo?.isDemo).toBe(true);
    expect(activeDemo?.workspace.subjects.length).toBeGreaterThanOrEqual(5);
    expect(activeDemo?.workspace.tasks.length).toBeGreaterThanOrEqual(5);
    expect(activeDemo?.workspace.plannerEvents.length).toBeGreaterThanOrEqual(5);
    expect(activeDemo?.workspace.focusSessions.length).toBeGreaterThanOrEqual(5);
    expect(activeDemo?.workspace.tasks.every((t) => t.isSample)).toBe(true);

    // Mutate demo workspace then reset
    updateActiveWorkspace((ws) => ({
      ...ws,
      tasks: [],
    }));
    expect(getActiveWorkspace(loadStorageState())?.workspace.tasks.length).toBe(0);

    const restored = resetDemoWorkspace();
    expect(getActiveWorkspace(restored)?.workspace.tasks.length).toBeGreaterThanOrEqual(5);
  });

  it("4. Computes Task Completion Rate and Planning Accuracy formulas accurately", () => {
    const today = formatLocalDate();
    const state = startDemoSession();
    const demoWs = getActiveWorkspace(state)!.workspace;

    const completion = calculateTaskCompletionMetrics(demoWs.tasks, undefined, today);
    expect(completion.totalPlannedTasks).toBe(demoWs.tasks.length);
    const expectedRate = Number(
      ((completion.completedTasks / completion.totalPlannedTasks) * 100).toFixed(1)
    );
    expect(completion.completionRate).toBe(expectedRate);

    // Verify Section 11.F exact formula:
    // Est = 100, Actual = 80 -> Abs Err = 20 -> % Err = 20% -> Accuracy = 80%
    // Est = 50, Actual = 120 -> Abs Err = 70 -> % Err = 140% -> Accuracy = max(0, 100 - 140) = 0%
    const accuracyResult = calculatePlanningAccuracy(
      [
        {
          id: "t1",
          userId: "u1",
          title: "Task 1",
          subjectId: "s1",
          priority: "high",
          status: "completed",
          deadline: today,
          estimatedMinutes: 100,
          actualMinutes: 80,
          createdAt: today,
          updatedAt: today,
        },
        {
          id: "t2",
          userId: "u1",
          title: "Task 2",
          subjectId: "s1",
          priority: "medium",
          status: "completed",
          deadline: today,
          estimatedMinutes: 50,
          actualMinutes: 120,
          createdAt: today,
          updatedAt: today,
        },
        {
          // Task with 0 actual minutes must be excluded from Planning Accuracy
          id: "t3",
          userId: "u1",
          title: "Unstarted Task",
          subjectId: "s1",
          priority: "low",
          status: "not-started",
          deadline: today,
          estimatedMinutes: 60,
          actualMinutes: 0,
          createdAt: today,
          updatedAt: today,
        },
      ],
      [{ id: "s1", userId: "u1", name: "Math", color: "#4F46E5" }]
    );

    expect(accuracyResult.evaluatedTasksCount).toBe(2);
    expect(accuracyResult.items[0].planningAccuracy).toBe(80);
    expect(accuracyResult.items[1].planningAccuracy).toBe(0);
    expect(accuracyResult.averagePlanningAccuracy).toBe(40);

    // Focus Analytics check
    const bounds = resolveDateRangeBounds("7days", today);
    const focusSummary = calculateFocusAnalytics(
      demoWs.focusSessions,
      demoWs.plannerEvents,
      bounds
    );
    expect(focusSummary.totalCompletedSessions).toBeGreaterThan(0);
    expect(focusSummary.totalFocusedMinutes).toBeGreaterThan(0);
  });

  it("5. Generates conflict-free study schedules and task breakdowns via Rule-Based AI Fallback", () => {
    const state = startDemoSession();
    const demoWs = getActiveWorkspace(state)!.workspace;

    const plan = generateRuleBasedStudyPlan({
      tasks: demoWs.tasks,
      subjects: demoWs.subjects,
      plannerEvents: demoWs.plannerEvents,
      dailyStudyGoalMinutes: 150,
      availableHoursPerDay: 3,
      preferredStartHour: 9,
    });

    expect(plan.source).toBe("rule-based-fallback");
    expect(plan.prioritizedTasks.length).toBeGreaterThan(0);
    expect(plan.recommendedSchedule.length).toBeGreaterThan(0);
    expect(plan.breakdownSubtasks?.length).toBe(4);
  });
});
