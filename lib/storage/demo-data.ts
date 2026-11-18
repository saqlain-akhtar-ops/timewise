import {
  FocusSession,
  PlannerEvent,
  ProductivityRecord,
  Subject,
  Task,
  UserPreferences,
  WorkspaceData,
} from "@/types";
import { addDaysToDateStr, formatLocalDate, getStartOfWeekDateStr } from "@/lib/utils";

export const DEMO_USER_ID = "demo_user";

export function createDefaultPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: "light",
    notificationsEnabled: true,
    weekStartsOn: "monday",
    focusDurationMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
  };
}

export function createDefaultStudentSubjects(userId: string): Subject[] {
  return [
    { id: `${userId}_sub_math`, userId, name: "Mathematics", color: "#4F46E5", code: "MATH101" },
    { id: `${userId}_sub_phys`, userId, name: "Physics", color: "#0284C7", code: "PHYS201" },
    { id: `${userId}_sub_cs`, userId, name: "Computer Science", color: "#7C3AED", code: "CS301" },
    { id: `${userId}_sub_eng`, userId, name: "English", color: "#16A34A", code: "ENG102" },
    { id: `${userId}_sub_des`, userId, name: "Digital Design", color: "#D97706", code: "DES204" },
  ];
}

export function createEmptyStudentWorkspace(userId: string): WorkspaceData {
  return {
    tasks: [],
    subjects: createDefaultStudentSubjects(userId),
    plannerEvents: [],
    focusSessions: [],
    preferences: createDefaultPreferences(userId),
    productivityRecords: [],
  };
}

export function buildDemoWorkspace(baseDate: Date = new Date()): WorkspaceData {
  const todayStr = formatLocalDate(baseDate);
  const weekStartStr = getStartOfWeekDateStr(baseDate, "monday");
  const nowIso = baseDate.toISOString();

  const subjects: Subject[] = [
    {
      id: "demo_sub_math",
      userId: DEMO_USER_ID,
      name: "Mathematics",
      color: "#4F46E5",
      code: "MATH201",
      isSample: true,
    },
    {
      id: "demo_sub_phys",
      userId: DEMO_USER_ID,
      name: "Physics",
      color: "#0284C7",
      code: "PHYS202",
      isSample: true,
    },
    {
      id: "demo_sub_cs",
      userId: DEMO_USER_ID,
      name: "Computer Science",
      color: "#7C3AED",
      code: "CS305",
      isSample: true,
    },
    {
      id: "demo_sub_eng",
      userId: DEMO_USER_ID,
      name: "English",
      color: "#16A34A",
      code: "ENG105",
      isSample: true,
    },
    {
      id: "demo_sub_des",
      userId: DEMO_USER_ID,
      name: "Digital Design",
      color: "#EA580C",
      code: "DES210",
      isSample: true,
    },
  ];

  const tasks: Task[] = [
    {
      id: "demo_task_1",
      userId: DEMO_USER_ID,
      title: "Complete Mathematics assignment",
      description: "Solve multivariable calculus problem set 4 (partial derivatives & Lagrange multipliers).",
      subjectId: "demo_sub_math",
      priority: "high",
      status: "in-progress",
      deadline: todayStr,
      scheduledDate: todayStr,
      estimatedMinutes: 90,
      actualMinutes: 50,
      notes: "Questions 1-4 completed. Review Question 5 proof before submission.",
      createdAt: addDaysToDateStr(todayStr, -4) + "T09:00:00.000Z",
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_task_2",
      userId: DEMO_USER_ID,
      title: "Revise Physics chapter",
      description: "Review Electromagnetic Induction and Faraday's Law lecture notes and worked examples.",
      subjectId: "demo_sub_phys",
      priority: "high",
      status: "not-started",
      deadline: addDaysToDateStr(todayStr, -1), // Overdue sample task
      scheduledDate: todayStr,
      estimatedMinutes: 60,
      actualMinutes: 25,
      notes: "Focus on Lenz's law sign conventions and coil flux derivations.",
      createdAt: addDaysToDateStr(todayStr, -5) + "T10:00:00.000Z",
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_task_3",
      userId: DEMO_USER_ID,
      title: "Prepare programming practical",
      description: "Implement graph traversal (BFS/DFS) and Dijkstra shortest-path lab exercises in TypeScript.",
      subjectId: "demo_sub_cs",
      priority: "high",
      status: "in-progress",
      deadline: addDaysToDateStr(todayStr, 1),
      scheduledDate: addDaysToDateStr(todayStr, 1),
      estimatedMinutes: 120,
      actualMinutes: 75,
      notes: "Unit tests for adjacency list passing; edge weight validation remaining.",
      createdAt: addDaysToDateStr(todayStr, -3) + "T14:00:00.000Z",
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_task_4",
      userId: DEMO_USER_ID,
      title: "Complete web development project",
      description: "Build responsive layout, accessibility audit, and interactive state architecture for studio milestone.",
      subjectId: "demo_sub_cs",
      priority: "medium",
      status: "not-started",
      deadline: addDaysToDateStr(todayStr, 3),
      scheduledDate: addDaysToDateStr(todayStr, 2),
      estimatedMinutes: 150,
      actualMinutes: 0,
      notes: "Include Lighthouse verification and keyboard navigation check.",
      createdAt: addDaysToDateStr(todayStr, -2) + "T11:30:00.000Z",
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_task_5",
      userId: DEMO_USER_ID,
      title: "Prepare examination notes",
      description: "Synthesize concise revision flashcards and formula sheets for upcoming mid-semester assessments.",
      subjectId: "demo_sub_eng",
      priority: "medium",
      status: "completed",
      deadline: addDaysToDateStr(todayStr, -2),
      scheduledDate: addDaysToDateStr(todayStr, -2),
      estimatedMinutes: 60,
      actualMinutes: 55,
      notes: "Completed rhetorical analysis summary and citation checklist.",
      createdAt: addDaysToDateStr(todayStr, -6) + "T08:00:00.000Z",
      updatedAt: addDaysToDateStr(todayStr, -2) + "T16:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -2) + "T16:00:00.000Z",
      isSample: true,
    },
    {
      id: "demo_task_6",
      userId: DEMO_USER_ID,
      title: "Digital Design UI wireframe critique",
      description: "Annotate typography hierarchy, grid spacing, and contrast ratios for peer design review.",
      subjectId: "demo_sub_des",
      priority: "low",
      status: "completed",
      deadline: addDaysToDateStr(todayStr, -1),
      scheduledDate: addDaysToDateStr(todayStr, -1),
      estimatedMinutes: 50,
      actualMinutes: 50,
      notes: "Exported Figma critique boards to PDF.",
      createdAt: addDaysToDateStr(todayStr, -4) + "T13:00:00.000Z",
      updatedAt: addDaysToDateStr(todayStr, -1) + "T17:30:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -1) + "T17:30:00.000Z",
      isSample: true,
    },
    {
      id: "demo_task_7",
      userId: DEMO_USER_ID,
      title: "Linear Algebra Eigenvalues Practice",
      description: "Work through characteristic polynomial and diagonalization problems from Chapter 6.",
      subjectId: "demo_sub_math",
      priority: "medium",
      status: "completed",
      deadline: todayStr,
      scheduledDate: todayStr,
      estimatedMinutes: 45,
      actualMinutes: 50,
      notes: "Verified all 3x3 matrix eigenvectors.",
      createdAt: addDaysToDateStr(todayStr, -3) + "T10:00:00.000Z",
      updatedAt: todayStr + "T08:30:00.000Z",
      completedAt: todayStr + "T08:30:00.000Z",
      isSample: true,
    },
    {
      id: "demo_task_8",
      userId: DEMO_USER_ID,
      title: "Academic Essay Draft: Technology in SDG 4",
      description: "Draft 1,200-word critical reflection on self-regulated learning tools in higher education.",
      subjectId: "demo_sub_eng",
      priority: "low",
      status: "not-started",
      deadline: addDaysToDateStr(todayStr, 5),
      scheduledDate: addDaysToDateStr(todayStr, 4),
      estimatedMinutes: 90,
      actualMinutes: 0,
      notes: "Include 5 peer-reviewed references on student time management.",
      createdAt: addDaysToDateStr(todayStr, -1) + "T15:00:00.000Z",
      updatedAt: nowIso,
      isSample: true,
    },
  ];

  // Populate weekly planner across Monday..Sunday of the current week
  const plannerEvents: PlannerEvent[] = [
    {
      id: "demo_evt_1",
      userId: DEMO_USER_ID,
      title: "Calculus Problem Set Deep Work",
      subjectId: "demo_sub_math",
      taskId: "demo_task_1",
      date: weekStartStr, // Monday
      startTime: "09:00",
      endTime: "10:30",
      plannedMinutes: 90,
      notes: "Complete first three multivariable integrals.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_2",
      userId: DEMO_USER_ID,
      title: "English Exam Notes Consolidation",
      subjectId: "demo_sub_eng",
      taskId: "demo_task_5",
      date: addDaysToDateStr(weekStartStr, 1), // Tuesday
      startTime: "11:00",
      endTime: "12:00",
      plannedMinutes: 60,
      notes: "Summarize seminar readings.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_3",
      userId: DEMO_USER_ID,
      title: "Graph Algorithms Practical Prep",
      subjectId: "demo_sub_cs",
      taskId: "demo_task_3",
      date: addDaysToDateStr(weekStartStr, 2), // Wednesday
      startTime: "14:00",
      endTime: "15:30",
      plannedMinutes: 90,
      notes: "Implement priority queue and shortest path tests.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_4",
      userId: DEMO_USER_ID,
      title: "Digital Design Wireframe Review",
      subjectId: "demo_sub_des",
      taskId: "demo_task_6",
      date: addDaysToDateStr(weekStartStr, 3), // Thursday
      startTime: "10:00",
      endTime: "11:00",
      plannedMinutes: 60,
      notes: "Check component contrast and spacing tokens.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_5",
      userId: DEMO_USER_ID,
      title: "Physics Electromagnetic Induction Revision",
      subjectId: "demo_sub_phys",
      taskId: "demo_task_2",
      date: todayStr, // Always ensure today has visible study blocks too
      startTime: "16:00",
      endTime: "17:00",
      plannedMinutes: 60,
      notes: "Focus on Faraday's law problem sheet.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_6",
      userId: DEMO_USER_ID,
      title: "Web Development Project Architecture",
      subjectId: "demo_sub_cs",
      taskId: "demo_task_4",
      date: addDaysToDateStr(weekStartStr, 4), // Friday
      startTime: "13:00",
      endTime: "15:00",
      plannedMinutes: 120,
      notes: "Build dashboard state and analytics charts.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
    {
      id: "demo_evt_7",
      userId: DEMO_USER_ID,
      title: "Weekly Review & SDG Essay Outline",
      subjectId: "demo_sub_eng",
      taskId: "demo_task_8",
      date: addDaysToDateStr(weekStartStr, 5), // Saturday
      startTime: "10:30",
      endTime: "12:00",
      plannedMinutes: 90,
      notes: "Outline essay sections and plan next week.",
      createdAt: nowIso,
      updatedAt: nowIso,
      isSample: true,
    },
  ];

  // Historical focus sessions across the last several days and today
  const focusSessions: FocusSession[] = [
    {
      id: "demo_sess_1",
      userId: DEMO_USER_ID,
      taskId: "demo_task_5",
      subjectId: "demo_sub_eng",
      mode: "focus",
      durationMinutes: 30,
      startedAt: addDaysToDateStr(todayStr, -4) + "T10:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -4) + "T10:30:00.000Z",
      date: addDaysToDateStr(todayStr, -4),
      notes: "Drafted core examination summary cards.",
      isSample: true,
    },
    {
      id: "demo_sess_2",
      userId: DEMO_USER_ID,
      taskId: "demo_task_5",
      subjectId: "demo_sub_eng",
      mode: "focus",
      durationMinutes: 25,
      startedAt: addDaysToDateStr(todayStr, -3) + "T11:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -3) + "T11:25:00.000Z",
      date: addDaysToDateStr(todayStr, -3),
      notes: "Completed English revision sheet.",
      isSample: true,
    },
    {
      id: "demo_sess_3",
      userId: DEMO_USER_ID,
      taskId: "demo_task_3",
      subjectId: "demo_sub_cs",
      mode: "focus",
      durationMinutes: 50,
      startedAt: addDaysToDateStr(todayStr, -2) + "T14:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -2) + "T14:50:00.000Z",
      date: addDaysToDateStr(todayStr, -2),
      notes: "Implemented BFS/DFS traversal in TypeScript.",
      isSample: true,
    },
    {
      id: "demo_sess_4",
      userId: DEMO_USER_ID,
      taskId: "demo_task_1",
      subjectId: "demo_sub_math",
      mode: "focus",
      durationMinutes: 25,
      startedAt: addDaysToDateStr(todayStr, -2) + "T16:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -2) + "T16:25:00.000Z",
      date: addDaysToDateStr(todayStr, -2),
      notes: "Solved problems 1 and 2.",
      isSample: true,
    },
    {
      id: "demo_sess_5",
      userId: DEMO_USER_ID,
      taskId: "demo_task_6",
      subjectId: "demo_sub_des",
      mode: "focus",
      durationMinutes: 50,
      startedAt: addDaysToDateStr(todayStr, -1) + "T10:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -1) + "T10:50:00.000Z",
      date: addDaysToDateStr(todayStr, -1),
      notes: "Completed UI hierarchy critique.",
      isSample: true,
    },
    {
      id: "demo_sess_6",
      userId: DEMO_USER_ID,
      taskId: "demo_task_3",
      subjectId: "demo_sub_cs",
      mode: "focus",
      durationMinutes: 25,
      startedAt: addDaysToDateStr(todayStr, -1) + "T15:00:00.000Z",
      completedAt: addDaysToDateStr(todayStr, -1) + "T15:25:00.000Z",
      date: addDaysToDateStr(todayStr, -1),
      notes: "Wrote unit tests for Dijkstra queue.",
      isSample: true,
    },
    {
      id: "demo_sess_7",
      userId: DEMO_USER_ID,
      taskId: "demo_task_7",
      subjectId: "demo_sub_math",
      mode: "focus",
      durationMinutes: 50,
      startedAt: todayStr + "T08:00:00.000Z",
      completedAt: todayStr + "T08:50:00.000Z",
      date: todayStr,
      notes: "Completed Linear Algebra eigenvalue practice.",
      isSample: true,
    },
    {
      id: "demo_sess_8",
      userId: DEMO_USER_ID,
      taskId: "demo_task_1",
      subjectId: "demo_sub_math",
      mode: "focus",
      durationMinutes: 25,
      startedAt: todayStr + "T09:15:00.000Z",
      completedAt: todayStr + "T09:40:00.000Z",
      date: todayStr,
      notes: "Worked on Lagrange multipliers.",
      isSample: true,
    },
    {
      id: "demo_sess_9",
      userId: DEMO_USER_ID,
      taskId: "demo_task_2",
      subjectId: "demo_sub_phys",
      mode: "focus",
      durationMinutes: 25,
      startedAt: todayStr + "T11:00:00.000Z",
      completedAt: todayStr + "T11:25:00.000Z",
      date: todayStr,
      notes: "Reviewed magnetic flux linkage formulas.",
      isSample: true,
    },
  ];

  const preferences = createDefaultPreferences(DEMO_USER_ID);
  const productivityRecords = computeProductivityRecords(
    DEMO_USER_ID,
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

export function computeProductivityRecords(
  userId: string,
  tasks: Task[],
  plannerEvents: PlannerEvent[],
  focusSessions: FocusSession[]
): ProductivityRecord[] {
  const datesSet = new Set<string>();
  plannerEvents.forEach((e) => datesSet.add(e.date));
  focusSessions.forEach((s) => datesSet.add(s.date));
  tasks.forEach((t) => {
    if (t.completedAt) datesSet.add(t.completedAt.slice(0, 10));
    if (t.scheduledDate) datesSet.add(t.scheduledDate);
  });

  const sortedDates = Array.from(datesSet).sort();
  return sortedDates.map((date) => {
    const dayPlanned = plannerEvents
      .filter((e) => e.date === date)
      .reduce((acc, e) => acc + (Number(e.plannedMinutes) || 0), 0);
    const dayFocusSessions = focusSessions.filter(
      (s) => s.date === date && s.mode === "focus"
    );
    const dayFocusMinutes = dayFocusSessions.reduce(
      (acc, s) => acc + (Number(s.durationMinutes) || 0),
      0
    );
    const dayCompletedTasks = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.slice(0, 10) === date
    ).length;

    return {
      date,
      userId,
      plannedMinutes: dayPlanned,
      actualFocusMinutes: dayFocusMinutes,
      completedTasksCount: dayCompletedTasks,
      focusSessionsCount: dayFocusSessions.length,
    };
  });
}
