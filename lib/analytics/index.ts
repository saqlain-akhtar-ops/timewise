import {
  FocusSession,
  PlannerEvent,
  Subject,
  Task,
  WorkspaceData,
} from "@/types";
import { addDaysToDateStr, formatLocalDate, isTaskOverdue } from "@/lib/utils";

export type AnalyticsFilterRange = "today" | "7days" | "30days" | "custom";

export interface DateRangeBounds {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string;
}

export function resolveDateRangeBounds(
  range: AnalyticsFilterRange,
  todayStr: string = formatLocalDate(),
  customStart?: string,
  customEnd?: string
): DateRangeBounds {
  if (range === "today") {
    return {
      startDate: todayStr,
      endDate: todayStr,
      label: `Today (${todayStr})`,
    };
  }
  if (range === "7days") {
    const start = addDaysToDateStr(todayStr, -6);
    return {
      startDate: start,
      endDate: todayStr,
      label: `Last 7 Days (${start} to ${todayStr})`,
    };
  }
  if (range === "30days") {
    const start = addDaysToDateStr(todayStr, -29);
    return {
      startDate: start,
      endDate: todayStr,
      label: `Last 30 Days (${start} to ${todayStr})`,
    };
  }
  const s = customStart && customStart <= (customEnd || todayStr) ? customStart : addDaysToDateStr(todayStr, -6);
  const e = customEnd && customEnd >= s ? customEnd : todayStr;
  return {
    startDate: s,
    endDate: e,
    label: `Custom Range (${s} to ${e})`,
  };
}

export interface TaskCompletionMetrics {
  totalPlannedTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number; // (Completed Tasks / Planned Tasks) * 100
}

export function calculateTaskCompletionMetrics(
  tasks: Task[],
  bounds?: DateRangeBounds,
  todayStr: string = formatLocalDate()
): TaskCompletionMetrics {
  const filtered = bounds
    ? tasks.filter((t) => {
        const refDate = t.scheduledDate || t.deadline || t.createdAt.slice(0, 10);
        const completedDate = t.completedAt ? t.completedAt.slice(0, 10) : null;
        return (
          (refDate >= bounds.startDate && refDate <= bounds.endDate) ||
          (completedDate !== null &&
            completedDate >= bounds.startDate &&
            completedDate <= bounds.endDate)
        );
      })
    : tasks;

  const totalPlannedTasks = filtered.length;
  const completedTasks = filtered.filter((t) => t.status === "completed").length;
  const pendingTasks = filtered.filter((t) => t.status !== "completed").length;
  const overdueTasks = filtered.filter((t) =>
    isTaskOverdue(t.deadline, t.status, todayStr)
  ).length;

  const completionRate =
    totalPlannedTasks > 0
      ? Number(((completedTasks / totalPlannedTasks) * 100).toFixed(1))
      : 0;

  return {
    totalPlannedTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionRate,
  };
}

export interface PlanningAccuracyItem {
  taskId: string;
  title: string;
  subjectName: string;
  estimatedMinutes: number;
  actualMinutes: number;
  absoluteErrorMinutes: number;
  percentageError: number;
  planningAccuracy: number;
}

export interface PlanningAccuracySummary {
  evaluatedTasksCount: number;
  averagePlanningAccuracy: number | null;
  averagePercentageError: number | null;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  items: PlanningAccuracyItem[];
}

/**
 * Section 11.F:
 * Absolute Estimation Error = |Actual Duration - Estimated Duration|
 * Percentage Estimation Error = (Absolute Estimation Error / Estimated Duration) * 100
 * Planning Accuracy = max(0, 100 - Percentage Estimation Error)
 * Only calculated for tasks with valid estimated (> 0) and actual (> 0) durations.
 */
export function calculatePlanningAccuracy(
  tasks: Task[],
  subjects: Subject[],
  bounds?: DateRangeBounds
): PlanningAccuracySummary {
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));

  const candidateTasks = bounds
    ? tasks.filter((t) => {
        const refDate =
          (t.completedAt && t.completedAt.slice(0, 10)) ||
          t.scheduledDate ||
          t.deadline;
        return refDate >= bounds.startDate && refDate <= bounds.endDate;
      })
    : tasks;

  const validTasks = candidateTasks.filter(
    (t) =>
      typeof t.estimatedMinutes === "number" &&
      t.estimatedMinutes > 0 &&
      typeof t.actualMinutes === "number" &&
      t.actualMinutes > 0
  );

  if (validTasks.length === 0) {
    return {
      evaluatedTasksCount: 0,
      averagePlanningAccuracy: null,
      averagePercentageError: null,
      totalEstimatedMinutes: 0,
      totalActualMinutes: 0,
      items: [],
    };
  }

  const items: PlanningAccuracyItem[] = validTasks.map((t) => {
    const est = t.estimatedMinutes;
    const act = t.actualMinutes;
    const absErr = Math.abs(act - est);
    const pctErr = (absErr / est) * 100;
    const accuracy = Math.max(0, 100 - pctErr);

    return {
      taskId: t.id,
      title: t.title,
      subjectName: subjectMap.get(t.subjectId) || "General",
      estimatedMinutes: est,
      actualMinutes: act,
      absoluteErrorMinutes: Math.round(absErr),
      percentageError: Number(pctErr.toFixed(1)),
      planningAccuracy: Number(accuracy.toFixed(1)),
    };
  });

  const avgAccuracy =
    items.reduce((acc, item) => acc + item.planningAccuracy, 0) / items.length;
  const avgPctErr =
    items.reduce((acc, item) => acc + item.percentageError, 0) / items.length;

  return {
    evaluatedTasksCount: items.length,
    averagePlanningAccuracy: Number(avgAccuracy.toFixed(1)),
    averagePercentageError: Number(avgPctErr.toFixed(1)),
    totalEstimatedMinutes: items.reduce((a, b) => a + b.estimatedMinutes, 0),
    totalActualMinutes: items.reduce((a, b) => a + b.actualMinutes, 0),
    items,
  };
}

export interface FocusAnalyticsSummary {
  totalCompletedSessions: number;
  totalFocusedMinutes: number;
  averageSessionDuration: number;
  dailyTrends: {
    date: string;
    label: string;
    focusedMinutes: number;
    sessionsCount: number;
    plannedMinutes: number;
  }[];
}

export function calculateFocusAnalytics(
  focusSessions: FocusSession[],
  plannerEvents: PlannerEvent[],
  bounds: DateRangeBounds
): FocusAnalyticsSummary {
  const focusOnly = focusSessions.filter(
    (s) =>
      s.mode === "focus" &&
      s.date >= bounds.startDate &&
      s.date <= bounds.endDate &&
      s.durationMinutes > 0
  );

  const totalCompletedSessions = focusOnly.length;
  const totalFocusedMinutes = focusOnly.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  );
  const averageSessionDuration =
    totalCompletedSessions > 0
      ? Number((totalFocusedMinutes / totalCompletedSessions).toFixed(1))
      : 0;

  // Build daily points between startDate and endDate (cap at 31 days for chart readability)
  const dailyTrends: FocusAnalyticsSummary["dailyTrends"] = [];
  let cursor = bounds.startDate;
  let guard = 0;
  while (cursor <= bounds.endDate && guard < 60) {
    const daySessions = focusOnly.filter((s) => s.date === cursor);
    const dayFocusMins = daySessions.reduce((a, b) => a + b.durationMinutes, 0);
    const dayPlannedMins = plannerEvents
      .filter((e) => e.date === cursor)
      .reduce((a, b) => a + b.plannedMinutes, 0);

    const [, m, d] = cursor.split("-");
    dailyTrends.push({
      date: cursor,
      label: `${m}/${d}`,
      focusedMinutes: dayFocusMins,
      sessionsCount: daySessions.length,
      plannedMinutes: dayPlannedMins,
    });

    cursor = addDaysToDateStr(cursor, 1);
    guard++;
  }

  return {
    totalCompletedSessions,
    totalFocusedMinutes,
    averageSessionDuration,
    dailyTrends,
  };
}

export interface SubjectBreakdownItem {
  subjectId: string;
  subjectName: string;
  color: string;
  estimatedTaskMinutes: number;
  plannedScheduleMinutes: number;
  actualFocusMinutes: number;
  tasksCount: number;
  completedTasksCount: number;
}

export function calculateSubjectAnalytics(
  workspace: WorkspaceData,
  bounds: DateRangeBounds
): SubjectBreakdownItem[] {
  const { subjects, tasks, plannerEvents, focusSessions } = workspace;

  return subjects.map((sub) => {
    const subTasks = tasks.filter((t) => {
      if (t.subjectId !== sub.id) return false;
      const refDate = t.scheduledDate || t.deadline || t.createdAt.slice(0, 10);
      return refDate >= bounds.startDate && refDate <= bounds.endDate;
    });

    const subEvents = plannerEvents.filter(
      (e) =>
        e.subjectId === sub.id &&
        e.date >= bounds.startDate &&
        e.date <= bounds.endDate
    );

    const subSessions = focusSessions.filter(
      (s) =>
        s.mode === "focus" &&
        s.subjectId === sub.id &&
        s.date >= bounds.startDate &&
        s.date <= bounds.endDate
    );

    const estimatedTaskMinutes = subTasks.reduce(
      (acc, t) => acc + (t.estimatedMinutes || 0),
      0
    );
    const plannedScheduleMinutes = subEvents.reduce(
      (acc, e) => acc + (e.plannedMinutes || 0),
      0
    );
    const actualFocusMinutes = subSessions.reduce(
      (acc, s) => acc + (s.durationMinutes || 0),
      0
    );

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      color: sub.color,
      estimatedTaskMinutes,
      plannedScheduleMinutes,
      actualFocusMinutes,
      tasksCount: subTasks.length,
      completedTasksCount: subTasks.filter((t) => t.status === "completed").length,
    };
  });
}
