import {
  AcademicLevel,
  ActiveSession,
  FocusSession,
  PlannerEvent,
  Student,
  Subject,
  Task,
  TimewiseStorageSchema,
  UserPreferences,
  WorkspaceData,
} from "@/types";
import {
  DEMO_USER_ID,
  buildDemoWorkspace,
  computeProductivityRecords,
  createDefaultPreferences,
  createDefaultStudentSubjects,
  createEmptyStudentWorkspace,
} from "./demo-data";
import { generateId } from "@/lib/utils";

export const STORAGE_KEY = "TIMEWISE_STORAGE_V1";
export const CURRENT_SCHEMA_VERSION = 1;

let memoryFallbackStore: TimewiseStorageSchema | null = null;

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__timewise_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function createInitialStorageState(): TimewiseStorageSchema {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    users: {},
    active_session: null,
    student_workspaces: {},
    demo_workspace: buildDemoWorkspace(),
  };
}

function sanitizeWorkspace(userId: string, raw: Partial<WorkspaceData> | undefined, isDemo: boolean): WorkspaceData {
  if (!raw || typeof raw !== "object") {
    return isDemo ? buildDemoWorkspace() : createEmptyStudentWorkspace(userId);
  }

  const subjects: Subject[] = Array.isArray(raw.subjects) && raw.subjects.length > 0
    ? raw.subjects.filter((s) => s && typeof s.id === "string" && typeof s.name === "string")
    : isDemo
    ? buildDemoWorkspace().subjects
    : createDefaultStudentSubjects(userId);

  const tasks: Task[] = Array.isArray(raw.tasks)
    ? raw.tasks.filter(
        (t) =>
          t &&
          typeof t.id === "string" &&
          typeof t.title === "string" &&
          t.userId === userId
      )
    : [];

  const plannerEvents: PlannerEvent[] = Array.isArray(raw.plannerEvents)
    ? raw.plannerEvents.filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          typeof e.title === "string" &&
          e.userId === userId
      )
    : [];

  // Deduplicate focus sessions by id
  const seenSessions = new Set<string>();
  const focusSessions: FocusSession[] = [];
  if (Array.isArray(raw.focusSessions)) {
    for (const s of raw.focusSessions) {
      if (
        s &&
        typeof s.id === "string" &&
        s.userId === userId &&
        !seenSessions.has(s.id)
      ) {
        seenSessions.add(s.id);
        focusSessions.push(s);
      }
    }
  }

  const preferences: UserPreferences = {
    ...createDefaultPreferences(userId),
    ...(raw.preferences || {}),
    userId,
  };

  const productivityRecords = computeProductivityRecords(
    userId,
    tasks,
    plannerEvents,
    focusSessions
  );

  return {
    tasks,
    subjects,
    plannerEvents,
    focusSessions,
    preferences,
    productivityRecords,
  };
}

export function loadStorageState(): TimewiseStorageSchema {
  if (!isLocalStorageAvailable()) {
    if (!memoryFallbackStore) {
      memoryFallbackStore = createInitialStorageState();
    }
    return memoryFallbackStore;
  }

  try {
    const rawStr = window.localStorage.getItem(STORAGE_KEY);
    if (!rawStr) {
      const initial = createInitialStorageState();
      saveStorageState(initial);
      return initial;
    }

    const parsed = JSON.parse(rawStr) as Partial<TimewiseStorageSchema>;
    if (!parsed || typeof parsed !== "object" || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
      const initial = createInitialStorageState();
      saveStorageState(initial);
      return initial;
    }

    const users: Record<string, Student> = {};
    if (parsed.users && typeof parsed.users === "object") {
      for (const [uid, u] of Object.entries(parsed.users)) {
        if (u && typeof u.id === "string" && typeof u.email === "string") {
          users[uid] = u;
        }
      }
    }

    const studentWorkspaces: Record<string, WorkspaceData> = {};
    for (const uid of Object.keys(users)) {
      studentWorkspaces[uid] = sanitizeWorkspace(
        uid,
        parsed.student_workspaces?.[uid],
        false
      );
    }

    const demoWorkspace = sanitizeWorkspace(
      DEMO_USER_ID,
      parsed.demo_workspace,
      true
    );

    let activeSession: ActiveSession | null = null;
    if (parsed.active_session && typeof parsed.active_session === "object") {
      if (parsed.active_session.mode === "demo") {
        activeSession = {
          mode: "demo",
          userId: DEMO_USER_ID,
          loggedInAt: parsed.active_session.loggedInAt || new Date().toISOString(),
        };
      } else if (
        parsed.active_session.mode === "student" &&
        users[parsed.active_session.userId]
      ) {
        activeSession = parsed.active_session;
      }
    }

    const state: TimewiseStorageSchema = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      users,
      active_session: activeSession,
      student_workspaces: studentWorkspaces,
      demo_workspace: demoWorkspace,
    };

    return state;
  } catch (err) {
    console.warn("TIMEWISE storage recovery triggered due to corrupted state:", err);
    const recovered = createInitialStorageState();
    saveStorageState(recovered);
    return recovered;
  }
}

export function saveStorageState(state: TimewiseStorageSchema): void {
  memoryFallbackStore = state;
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to persist TIMEWISE state to localStorage:", err);
  }
}

export function registerStudentAccount(params: {
  fullName: string;
  email: string;
  passwordHash: string;
  academicLevel: AcademicLevel;
  dailyStudyGoalMinutes: number;
}): { student: Student; state: TimewiseStorageSchema } {
  const state = loadStorageState();
  const normalizedEmail = params.email.trim().toLowerCase();

  const existing = Object.values(state.users).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );
  if (existing) {
    throw new Error("An account with this email address already exists.");
  }

  const userId = generateId("user");
  const nowIso = new Date().toISOString();

  const student: Student = {
    id: userId,
    fullName: params.fullName.trim(),
    email: normalizedEmail,
    passwordHash: params.passwordHash,
    academicLevel: params.academicLevel,
    dailyStudyGoalMinutes: Math.max(15, Math.min(720, Number(params.dailyStudyGoalMinutes) || 120)),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  state.users[userId] = student;
  state.student_workspaces[userId] = createEmptyStudentWorkspace(userId);
  state.active_session = {
    mode: "student",
    userId,
    loggedInAt: nowIso,
  };

  saveStorageState(state);
  return { student, state };
}

export function loginStudentAccount(
  email: string,
  passwordHash: string
): { student: Student; state: TimewiseStorageSchema } {
  const state = loadStorageState();
  const normalizedEmail = email.trim().toLowerCase();
  const student = Object.values(state.users).find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!student || student.passwordHash !== passwordHash) {
    throw new Error("Invalid email address or password.");
  }

  if (!state.student_workspaces[student.id]) {
    state.student_workspaces[student.id] = createEmptyStudentWorkspace(student.id);
  }

  state.active_session = {
    mode: "student",
    userId: student.id,
    loggedInAt: new Date().toISOString(),
  };

  saveStorageState(state);
  return { student, state };
}

export function switchStudentAccount(userId: string): TimewiseStorageSchema {
  const state = loadStorageState();
  const student = state.users[userId];
  if (!student) {
    throw new Error("Selected student profile does not exist.");
  }
  if (!state.student_workspaces[userId]) {
    state.student_workspaces[userId] = createEmptyStudentWorkspace(userId);
  }
  state.active_session = {
    mode: "student",
    userId,
    loggedInAt: new Date().toISOString(),
  };
  saveStorageState(state);
  return state;
}

export function startDemoSession(): TimewiseStorageSchema {
  const state = loadStorageState();
  state.active_session = {
    mode: "demo",
    userId: DEMO_USER_ID,
    loggedInAt: new Date().toISOString(),
  };
  saveStorageState(state);
  return state;
}

export function logoutSession(): TimewiseStorageSchema {
  const state = loadStorageState();
  state.active_session = null;
  saveStorageState(state);
  return state;
}

export function resetDemoWorkspace(): TimewiseStorageSchema {
  const state = loadStorageState();
  state.demo_workspace = buildDemoWorkspace();
  saveStorageState(state);
  return state;
}

export function resetPersonalWorkspace(userId: string): TimewiseStorageSchema {
  const state = loadStorageState();
  if (!state.users[userId]) {
    throw new Error("Student account not found.");
  }
  state.student_workspaces[userId] = createEmptyStudentWorkspace(userId);
  saveStorageState(state);
  return state;
}

export function getActiveWorkspace(state: TimewiseStorageSchema): {
  userId: string;
  isDemo: boolean;
  workspace: WorkspaceData;
  student: Student | null;
} | null {
  if (!state.active_session) return null;
  if (state.active_session.mode === "demo") {
    return {
      userId: DEMO_USER_ID,
      isDemo: true,
      workspace: state.demo_workspace,
      student: {
        id: DEMO_USER_ID,
        fullName: "Alex Rivera (Demo Student)",
        email: "alex.demo@university.edu",
        passwordHash: "demo",
        academicLevel: "undergraduate",
        dailyStudyGoalMinutes: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const uid = state.active_session.userId;
  const student = state.users[uid];
  if (!student) return null;
  const workspace =
    state.student_workspaces[uid] || createEmptyStudentWorkspace(uid);
  return {
    userId: uid,
    isDemo: false,
    workspace,
    student,
  };
}

export function updateActiveWorkspace(
  updater: (workspace: WorkspaceData, userId: string, isDemo: boolean) => WorkspaceData
): TimewiseStorageSchema {
  const state = loadStorageState();
  const active = getActiveWorkspace(state);
  if (!active) {
    throw new Error("No active session found.");
  }

  const updated = updater(active.workspace, active.userId, active.isDemo);
  updated.productivityRecords = computeProductivityRecords(
    active.userId,
    updated.tasks,
    updated.plannerEvents,
    updated.focusSessions
  );

  if (active.isDemo) {
    state.demo_workspace = updated;
  } else {
    state.student_workspaces[active.userId] = updated;
  }

  saveStorageState(state);
  return state;
}
