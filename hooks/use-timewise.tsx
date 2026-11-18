"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AcademicLevel,
  FocusModeType,
  FocusSession,
  PlannerEvent,
  Student,
  Subject,
  Task,
  TaskPriority,
  TaskStatus,
  TimewiseStorageSchema,
  UserPreferences,
  WorkspaceData,
} from "@/types";
import {
  getActiveWorkspace,
  loadStorageState,
  loginStudentAccount,
  logoutSession,
  registerStudentAccount,
  resetDemoWorkspace,
  resetPersonalWorkspace,
  saveStorageState,
  startDemoSession,
  switchStudentAccount,
  updateActiveWorkspace,
} from "@/lib/storage";
import { hashPasswordPrototype } from "@/lib/auth/crypto";
import { formatLocalDate, generateId, parseTimeToMinutes } from "@/lib/utils";

interface TimewiseContextValue {
  hydrated: boolean;
  storageState: TimewiseStorageSchema | null;
  activeUser: Student | null;
  isDemo: boolean;
  workspace: WorkspaceData | null;
  registeredStudents: Student[];
  // Auth & workspace actions
  registerStudent: (params: {
    fullName: string;
    email: string;
    passwordPlain: string;
    academicLevel: AcademicLevel;
    dailyStudyGoalMinutes: number;
  }) => Promise<void>;
  loginStudent: (email: string, passwordPlain: string) => Promise<void>;
  switchAccount: (userId: string) => void;
  enterDemoMode: () => void;
  logout: () => void;
  resetDemo: () => void;
  resetCurrentStudentWorkspace: () => void;
  updateStudentProfile: (updates: {
    fullName: string;
    email: string;
    academicLevel: AcademicLevel;
    dailyStudyGoalMinutes: number;
  }) => void;
  // Subject actions
  addSubject: (name: string, color: string, code?: string) => Subject;
  deleteSubject: (subjectId: string) => void;
  // Task actions
  addTask: (input: {
    title: string;
    description?: string;
    subjectId: string;
    priority: TaskPriority;
    status?: TaskStatus;
    deadline: string;
    scheduledDate?: string;
    estimatedMinutes: number;
    notes?: string;
  }) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskComplete: (taskId: string) => void;
  // Planner actions
  addPlannerEvent: (input: {
    title: string;
    subjectId: string;
    taskId?: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => PlannerEvent;
  updatePlannerEvent: (eventId: string, updates: Partial<PlannerEvent>) => void;
  deletePlannerEvent: (eventId: string) => void;
  // Focus Session actions
  recordCompletedFocusSession: (input: {
    sessionKey?: string; // optional idempotency key to prevent duplicate records
    taskId?: string;
    subjectId?: string;
    mode: FocusModeType;
    durationMinutes: number;
    startedAt: string;
    completedAt: string;
    notes?: string;
  }) => FocusSession | null;
  // Preferences actions
  updatePreferences: (updates: Partial<UserPreferences>) => void;
}

const TimewiseContext = createContext<TimewiseContextValue | undefined>(undefined);

export function TimewiseProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [storageState, setStorageState] = useState<TimewiseStorageSchema | null>(null);

  useEffect(() => {
    const loaded = loadStorageState();
    setStorageState(loaded);
    setHydrated(true);
  }, []);

  const activeBundle = storageState ? getActiveWorkspace(storageState) : null;
  const activeUser = activeBundle?.student ?? null;
  const isDemo = activeBundle?.isDemo ?? false;
  const workspace = activeBundle?.workspace ?? null;
  const registeredStudents = storageState ? Object.values(storageState.users) : [];

  // Apply theme class to document root
  useEffect(() => {
    if (!hydrated || typeof document === "undefined") return;
    const theme = workspace?.preferences?.theme || "light";
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [hydrated, workspace?.preferences?.theme]);

  const registerStudent = useCallback(
    async (params: {
      fullName: string;
      email: string;
      passwordPlain: string;
      academicLevel: AcademicLevel;
      dailyStudyGoalMinutes: number;
    }) => {
      const passwordHash = await hashPasswordPrototype(params.passwordPlain);
      const { state } = registerStudentAccount({
        fullName: params.fullName,
        email: params.email,
        passwordHash,
        academicLevel: params.academicLevel,
        dailyStudyGoalMinutes: params.dailyStudyGoalMinutes,
      });
      setStorageState({ ...state });
    },
    []
  );

  const loginStudent = useCallback(async (email: string, passwordPlain: string) => {
    const passwordHash = await hashPasswordPrototype(passwordPlain);
    const { state } = loginStudentAccount(email, passwordHash);
    setStorageState({ ...state });
  }, []);

  const switchAccount = useCallback((userId: string) => {
    const nextState = switchStudentAccount(userId);
    setStorageState({ ...nextState });
  }, []);

  const enterDemoMode = useCallback(() => {
    const nextState = startDemoSession();
    setStorageState({ ...nextState });
  }, []);

  const logout = useCallback(() => {
    const nextState = logoutSession();
    setStorageState({ ...nextState });
  }, []);

  const resetDemo = useCallback(() => {
    const nextState = resetDemoWorkspace();
    setStorageState({ ...nextState });
  }, []);

  const resetCurrentStudentWorkspace = useCallback(() => {
    if (!activeBundle || activeBundle.isDemo) return;
    const nextState = resetPersonalWorkspace(activeBundle.userId);
    setStorageState({ ...nextState });
  }, [activeBundle]);

  const updateStudentProfile = useCallback(
    (updates: {
      fullName: string;
      email: string;
      academicLevel: AcademicLevel;
      dailyStudyGoalMinutes: number;
    }) => {
      const state = loadStorageState();
      if (!state.active_session || state.active_session.mode === "demo") return;
      const uid = state.active_session.userId;
      const existing = state.users[uid];
      if (!existing) return;

      state.users[uid] = {
        ...existing,
        fullName: updates.fullName.trim() || existing.fullName,
        email: updates.email.trim().toLowerCase() || existing.email,
        academicLevel: updates.academicLevel,
        dailyStudyGoalMinutes: Math.max(
          15,
          Math.min(720, Number(updates.dailyStudyGoalMinutes) || 120)
        ),
        updatedAt: new Date().toISOString(),
      };
      saveStorageState(state);
      setStorageState({ ...state });
    },
    []
  );

  const addSubject = useCallback((name: string, color: string, code?: string): Subject => {
    let createdSubject!: Subject;
    const nextState = updateActiveWorkspace((ws, userId, demoFlag) => {
      createdSubject = {
        id: generateId("sub"),
        userId,
        name: name.trim(),
        color: color || "#4F46E5",
        code: code?.trim() || undefined,
        isSample: demoFlag ? true : undefined,
      };
      return {
        ...ws,
        subjects: [...ws.subjects, createdSubject],
      };
    });
    setStorageState({ ...nextState });
    return createdSubject;
  }, []);

  const deleteSubject = useCallback((subjectId: string) => {
    const nextState = updateActiveWorkspace((ws) => {
      if (ws.subjects.length <= 1) return ws;
      const fallbackSubId = ws.subjects.find((s) => s.id !== subjectId)?.id || "";
      return {
        ...ws,
        subjects: ws.subjects.filter((s) => s.id !== subjectId),
        tasks: ws.tasks.map((t) =>
          t.subjectId === subjectId ? { ...t, subjectId: fallbackSubId } : t
        ),
        plannerEvents: ws.plannerEvents.map((e) =>
          e.subjectId === subjectId ? { ...e, subjectId: fallbackSubId } : e
        ),
      };
    });
    setStorageState({ ...nextState });
  }, []);

  const addTask = useCallback(
    (input: {
      title: string;
      description?: string;
      subjectId: string;
      priority: TaskPriority;
      status?: TaskStatus;
      deadline: string;
      scheduledDate?: string;
      estimatedMinutes: number;
      notes?: string;
    }): Task => {
      let createdTask!: Task;
      const nowIso = new Date().toISOString();
      const nextState = updateActiveWorkspace((ws, userId, demoFlag) => {
        const status: TaskStatus = input.status || "not-started";
        createdTask = {
          id: generateId("task"),
          userId,
          title: input.title.trim(),
          description: input.description?.trim() || "",
          subjectId: input.subjectId || ws.subjects[0]?.id || "general",
          priority: input.priority,
          status,
          deadline: input.deadline,
          scheduledDate: input.scheduledDate || input.deadline,
          estimatedMinutes: Math.max(5, Number(input.estimatedMinutes) || 30),
          actualMinutes: 0,
          notes: input.notes?.trim() || "",
          createdAt: nowIso,
          updatedAt: nowIso,
          completedAt: status === "completed" ? nowIso : undefined,
          isSample: demoFlag ? true : undefined,
        };
        return {
          ...ws,
          tasks: [createdTask, ...ws.tasks],
        };
      });
      setStorageState({ ...nextState });
      return createdTask;
    },
    []
  );

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const nowIso = new Date().toISOString();
    const nextState = updateActiveWorkspace((ws) => ({
      ...ws,
      tasks: ws.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus = updates.status ?? t.status;
        const completedAt =
          nextStatus === "completed"
            ? t.completedAt || nowIso
            : undefined;
        return {
          ...t,
          ...updates,
          status: nextStatus,
          completedAt,
          updatedAt: nowIso,
        };
      }),
    }));
    setStorageState({ ...nextState });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    const nextState = updateActiveWorkspace((ws) => ({
      ...ws,
      tasks: ws.tasks.filter((t) => t.id !== taskId),
      plannerEvents: ws.plannerEvents.map((e) =>
        e.taskId === taskId ? { ...e, taskId: undefined } : e
      ),
    }));
    setStorageState({ ...nextState });
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    const nowIso = new Date().toISOString();
    const nextState = updateActiveWorkspace((ws) => ({
      ...ws,
      tasks: ws.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const isCompleting = t.status !== "completed";
        return {
          ...t,
          status: isCompleting ? "completed" : "not-started",
          completedAt: isCompleting ? nowIso : undefined,
          updatedAt: nowIso,
        };
      }),
    }));
    setStorageState({ ...nextState });
  }, []);

  const addPlannerEvent = useCallback(
    (input: {
      title: string;
      subjectId: string;
      taskId?: string;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }): PlannerEvent => {
      const startMins = parseTimeToMinutes(input.startTime);
      const endMins = parseTimeToMinutes(input.endTime);
      if (endMins <= startMins) {
        throw new Error("End time must be after start time.");
      }
      const plannedMinutes = endMins - startMins;
      const nowIso = new Date().toISOString();
      let createdEvent!: PlannerEvent;

      const nextState = updateActiveWorkspace((ws, userId, demoFlag) => {
        createdEvent = {
          id: generateId("evt"),
          userId,
          title: input.title.trim(),
          subjectId: input.subjectId || ws.subjects[0]?.id || "general",
          taskId: input.taskId || undefined,
          date: input.date,
          startTime: input.startTime,
          endTime: input.endTime,
          plannedMinutes,
          notes: input.notes?.trim() || "",
          createdAt: nowIso,
          updatedAt: nowIso,
          isSample: demoFlag ? true : undefined,
        };
        return {
          ...ws,
          plannerEvents: [...ws.plannerEvents, createdEvent],
        };
      });
      setStorageState({ ...nextState });
      return createdEvent;
    },
    []
  );

  const updatePlannerEvent = useCallback(
    (eventId: string, updates: Partial<PlannerEvent>) => {
      const nowIso = new Date().toISOString();
      const nextState = updateActiveWorkspace((ws) => ({
        ...ws,
        plannerEvents: ws.plannerEvents.map((e) => {
          if (e.id !== eventId) return e;
          const nextStart = updates.startTime ?? e.startTime;
          const nextEnd = updates.endTime ?? e.endTime;
          const startMins = parseTimeToMinutes(nextStart);
          const endMins = parseTimeToMinutes(nextEnd);
          if (endMins <= startMins) {
            throw new Error("End time must be after start time.");
          }
          return {
            ...e,
            ...updates,
            startTime: nextStart,
            endTime: nextEnd,
            plannedMinutes: endMins - startMins,
            updatedAt: nowIso,
          };
        }),
      }));
      setStorageState({ ...nextState });
    },
    []
  );

  const deletePlannerEvent = useCallback((eventId: string) => {
    const nextState = updateActiveWorkspace((ws) => ({
      ...ws,
      plannerEvents: ws.plannerEvents.filter((e) => e.id !== eventId),
    }));
    setStorageState({ ...nextState });
  }, []);

  const recordCompletedFocusSession = useCallback(
    (input: {
      sessionKey?: string;
      taskId?: string;
      subjectId?: string;
      mode: FocusModeType;
      durationMinutes: number;
      startedAt: string;
      completedAt: string;
      notes?: string;
    }): FocusSession | null => {
      if (input.durationMinutes <= 0) return null;
      let recordedSession: FocusSession | null = null;
      const sessionId = input.sessionKey || generateId("sess");

      const nextState = updateActiveWorkspace((ws, userId, demoFlag) => {
        // Guard against duplicate session records
        if (ws.focusSessions.some((s) => s.id === sessionId)) {
          return ws;
        }

        const linkedTask = input.taskId
          ? ws.tasks.find((t) => t.id === input.taskId)
          : undefined;
        const resolvedSubjectId =
          input.subjectId || linkedTask?.subjectId || ws.subjects[0]?.id;

        recordedSession = {
          id: sessionId,
          userId,
          taskId: input.taskId || undefined,
          subjectId: resolvedSubjectId,
          mode: input.mode,
          durationMinutes: Math.round(input.durationMinutes),
          startedAt: input.startedAt,
          completedAt: input.completedAt,
          date: formatLocalDate(new Date(input.completedAt)),
          notes: input.notes?.trim() || undefined,
          isSample: demoFlag ? true : undefined,
        };

        // Update linked task's actualMinutes when a focus session finishes
        const updatedTasks =
          input.mode === "focus" && input.taskId
            ? ws.tasks.map((t) => {
                if (t.id !== input.taskId) return t;
                const nextStatus: TaskStatus =
                  t.status === "not-started" ? "in-progress" : t.status;
                return {
                  ...t,
                  actualMinutes: (t.actualMinutes || 0) + Math.round(input.durationMinutes),
                  status: nextStatus,
                  updatedAt: input.completedAt,
                };
              })
            : ws.tasks;

        return {
          ...ws,
          tasks: updatedTasks,
          focusSessions: [recordedSession, ...ws.focusSessions],
        };
      });

      setStorageState({ ...nextState });
      return recordedSession;
    },
    []
  );

  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    const nextState = updateActiveWorkspace((ws, userId) => ({
      ...ws,
      preferences: {
        ...ws.preferences,
        ...updates,
        userId,
      },
    }));
    setStorageState({ ...nextState });
  }, []);

  return (
    <TimewiseContext.Provider
      value={{
        hydrated,
        storageState,
        activeUser,
        isDemo,
        workspace,
        registeredStudents,
        registerStudent,
        loginStudent,
        switchAccount,
        enterDemoMode,
        logout,
        resetDemo,
        resetCurrentStudentWorkspace,
        updateStudentProfile,
        addSubject,
        deleteSubject,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        addPlannerEvent,
        updatePlannerEvent,
        deletePlannerEvent,
        recordCompletedFocusSession,
        updatePreferences,
      }}
    >
      {children}
    </TimewiseContext.Provider>
  );
}

export function useTimewise() {
  const ctx = useContext(TimewiseContext);
  if (!ctx) {
    throw new Error("useTimewise must be used within a TimewiseProvider");
  }
  return ctx;
}
