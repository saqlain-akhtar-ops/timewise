export type AcademicLevel = "school" | "undergraduate" | "postgraduate";

export type TaskPriority = "high" | "medium" | "low";

export type TaskStatus = "not-started" | "in-progress" | "completed";

export type AccountMode = "student" | "demo";

export interface Student {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string; // Never store plaintext passwords; SHA-256 salted prototype digest
  academicLevel: AcademicLevel;
  dailyStudyGoalMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  color: string;
  code?: string;
  isSample?: boolean;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subjectId: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string; // ISO date string YYYY-MM-DD
  scheduledDate?: string; // Optional YYYY-MM-DD
  estimatedMinutes: number;
  actualMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  isSample?: boolean;
}

export interface PlannerEvent {
  id: string;
  userId: string;
  title: string;
  subjectId: string;
  taskId?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h, e.g., "09:00")
  endTime: string; // HH:mm (24h, e.g., "10:30")
  plannedMinutes: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isSample?: boolean;
}

export type FocusModeType = "focus" | "short-break" | "long-break";

export interface FocusSession {
  id: string;
  userId: string;
  taskId?: string;
  subjectId?: string;
  mode: FocusModeType;
  durationMinutes: number;
  startedAt: string; // ISO timestamp
  completedAt: string; // ISO timestamp
  date: string; // YYYY-MM-DD local date
  notes?: string;
  isSample?: boolean;
}

export interface UserPreferences {
  userId: string;
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  weekStartsOn: "monday" | "sunday";
  focusDurationMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}

export interface ProductivityRecord {
  date: string; // YYYY-MM-DD
  userId: string;
  plannedMinutes: number;
  actualFocusMinutes: number;
  completedTasksCount: number;
  focusSessionsCount: number;
}

export interface WorkspaceData {
  tasks: Task[];
  subjects: Subject[];
  plannerEvents: PlannerEvent[];
  focusSessions: FocusSession[];
  preferences: UserPreferences;
  productivityRecords: ProductivityRecord[];
}

export interface ActiveSession {
  mode: AccountMode;
  userId: string; // "demo_user" when mode === "demo"
  loggedInAt: string;
}

export interface TimewiseStorageSchema {
  schemaVersion: number;
  users: Record<string, Student>;
  active_session: ActiveSession | null;
  student_workspaces: Record<string, WorkspaceData>;
  demo_workspace: WorkspaceData;
}

export interface AIScheduleSuggestion {
  id: string;
  title: string;
  subjectId: string;
  taskId?: string;
  date: string;
  startTime: string;
  endTime: string;
  plannedMinutes: number;
  reason: string;
}

export interface AITaskBreakdownItem {
  title: string;
  estimatedMinutes: number;
  priority: TaskPriority;
  rationale: string;
}

export interface AIResponsePayload {
  source: "ai" | "rule-based-fallback";
  providerName?: string;
  modelName?: string;
  fallbackNotice?: string;
  prioritizedTasks: {
    taskId: string;
    title: string;
    rank: number;
    urgencyScore: number;
    reason: string;
  }[];
  recommendedSchedule: AIScheduleSuggestion[];
  breakdownSubtasks?: AITaskBreakdownItem[];
  conflictWarnings: {
    severity: "high" | "medium" | "low";
    message: string;
    recommendation: string;
  }[];
  summaryExplanation: string;
}
