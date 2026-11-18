import {
  AIResponsePayload,
  AIScheduleSuggestion,
  AITaskBreakdownItem,
  PlannerEvent,
  Subject,
  Task,
} from "@/types";
import {
  addDaysToDateStr,
  formatLocalDate,
  generateId,
  minutesToTimeStr,
  parseTimeToMinutes,
} from "@/lib/utils";

export interface StudyAssistantInput {
  tasks: Task[];
  subjects: Subject[];
  plannerEvents: PlannerEvent[];
  dailyStudyGoalMinutes: number;
  availableHoursPerDay?: number;
  preferredStartHour?: number; // e.g., 9 for 09:00
  assignmentToBreakDown?: {
    title: string;
    subjectId: string;
    totalEstimatedMinutes: number;
    deadline: string;
    notes?: string;
  };
}

function computeDaysUntil(deadline: string, todayStr: string): number {
  const [y1, m1, d1] = todayStr.split("-").map(Number);
  const [y2, m2, d2] = deadline.split("-").map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  return Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateRuleBasedStudyPlan(
  input: StudyAssistantInput,
  fallbackReason?: string
): AIResponsePayload {
  const todayStr = formatLocalDate();
  const pendingTasks = input.tasks.filter((t) => t.status !== "completed");
  const subjectMap = new Map(input.subjects.map((s) => [s.id, s.name]));

  // 1. Prioritize tasks by priority + deadline proximity + remaining effort
  const scored = pendingTasks.map((t) => {
    const daysUntil = computeDaysUntil(t.deadline, todayStr);
    const priorityWeight =
      t.priority === "high" ? 50 : t.priority === "medium" ? 30 : 15;
    const urgencyWeight =
      daysUntil < 0
        ? 45 // Overdue
        : daysUntil === 0
        ? 40 // Due today
        : daysUntil <= 2
        ? 30
        : daysUntil <= 5
        ? 18
        : Math.max(2, 15 - daysUntil);

    const remainingMinutes = Math.max(
      15,
      (t.estimatedMinutes || 60) - (t.actualMinutes || 0)
    );
    const effortBonus = remainingMinutes >= 90 ? 10 : 5;
    const urgencyScore = Math.min(100, priorityWeight + urgencyWeight + effortBonus);

    let reason = "";
    if (daysUntil < 0) {
      reason = `Overdue by ${Math.abs(daysUntil)} day(s) with ${t.priority.toUpperCase()} priority — requires immediate recovery block.`;
    } else if (daysUntil === 0) {
      reason = `Due today (${t.deadline}) with ${remainingMinutes}m remaining effort.`;
    } else {
      reason = `Due in ${daysUntil} day(s) (${t.deadline}), ${t.priority.toUpperCase()} priority (${remainingMinutes}m remaining).`;
    }

    return {
      task: t,
      daysUntil,
      remainingMinutes,
      urgencyScore,
      reason,
    };
  });

  scored.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const prioritizedTasks = scored.map((item, idx) => ({
    taskId: item.task.id,
    title: item.task.title,
    rank: idx + 1,
    urgencyScore: item.urgencyScore,
    reason: item.reason,
  }));

  // 2. Detect conflicts in existing planner events & deadline bottlenecks
  const conflictWarnings: AIResponsePayload["conflictWarnings"] = [];
  const eventsByDate = new Map<string, PlannerEvent[]>();
  for (const evt of input.plannerEvents) {
    const list = eventsByDate.get(evt.date) || [];
    list.push(evt);
    eventsByDate.set(evt.date, list);
  }

  for (const [date, list] of eventsByDate.entries()) {
    const sorted = [...list].sort(
      (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const currEnd = parseTimeToMinutes(sorted[i].endTime);
      const nextStart = parseTimeToMinutes(sorted[i + 1].startTime);
      if (currEnd > nextStart) {
        conflictWarnings.push({
          severity: "high",
          message: `Overlapping sessions on ${date}: "${sorted[i].title}" (${sorted[i].startTime}–${sorted[i].endTime}) conflicts with "${sorted[i + 1].title}" (${sorted[i + 1].startTime}–${sorted[i + 1].endTime}).`,
          recommendation: `Shift "${sorted[i + 1].title}" to start at ${minutesToTimeStr(currEnd + 15)} after a 15-minute buffer.`,
        });
      }
    }
  }

  const overdueCount = scored.filter((s) => s.daysUntil < 0).length;
  if (overdueCount > 0) {
    conflictWarnings.push({
      severity: "high",
      message: `${overdueCount} task(s) have passed their deadline without completion.`,
      recommendation:
        "Prioritize overdue deliverables in the first morning focus block today and renegotiate lower-priority study blocks.",
    });
  }

  // 3. Build non-overlapping schedule blocks across the next 5 days respecting daily study goal
  const dailyCapMinutes = Math.max(
    45,
    Math.min(
      480,
      input.availableHoursPerDay
        ? input.availableHoursPerDay * 60
        : input.dailyStudyGoalMinutes || 150
    )
  );
  const startHour = input.preferredStartHour ?? 9;
  const recommendedSchedule: AIScheduleSuggestion[] = [];

  // Track occupied intervals per date
  const occupiedMap = new Map<string, { start: number; end: number }[]>();
  for (const evt of input.plannerEvents) {
    const intervals = occupiedMap.get(evt.date) || [];
    intervals.push({
      start: parseTimeToMinutes(evt.startTime),
      end: parseTimeToMinutes(evt.endTime),
    });
    occupiedMap.set(evt.date, intervals);
  }

  const dailyAllocated = new Map<string, number>();
  for (const [date, list] of eventsByDate.entries()) {
    dailyAllocated.set(
      date,
      list.reduce((acc, e) => acc + (e.plannedMinutes || 0), 0)
    );
  }

  function findFreeSlot(date: string, durationMins: number): { start: number; end: number } | null {
    const usedToday = dailyAllocated.get(date) || 0;
    if (usedToday + durationMins > dailyCapMinutes + 30) {
      return null;
    }
    const intervals = (occupiedMap.get(date) || []).sort((a, b) => a.start - b.start);
    let candidateStart = startHour * 60;
    const latestEnd = 21 * 60; // 21:00

    for (const iv of intervals) {
      if (candidateStart + durationMins <= iv.start) {
        break;
      }
      if (candidateStart < iv.end + 15) {
        candidateStart = iv.end + 15; // 15-min rest break between study blocks
      }
    }

    if (candidateStart + durationMins > latestEnd) {
      return null;
    }

    const slot = { start: candidateStart, end: candidateStart + durationMins };
    intervals.push(slot);
    occupiedMap.set(date, intervals);
    dailyAllocated.set(date, usedToday + durationMins);
    return slot;
  }

  for (const item of scored.slice(0, 6)) {
    let remainingToSchedule = Math.min(180, item.remainingMinutes);
    let sessionPart = 1;
    const totalParts = Math.ceil(remainingToSchedule / 60);

    for (let dayOffset = 0; dayOffset < 6 && remainingToSchedule > 0; dayOffset++) {
      const targetDate = addDaysToDateStr(todayStr, dayOffset);
      const chunkMinutes = Math.min(60, Math.max(30, remainingToSchedule));
      const slot = findFreeSlot(targetDate, chunkMinutes);
      if (slot) {
        const subName = subjectMap.get(item.task.subjectId) || "Study";
        recommendedSchedule.push({
          id: generateId("aisched"),
          title:
            totalParts > 1
              ? `${item.task.title} (Session ${sessionPart}/${totalParts})`
              : item.task.title,
          subjectId: item.task.subjectId,
          taskId: item.task.id,
          date: targetDate,
          startTime: minutesToTimeStr(slot.start),
          endTime: minutesToTimeStr(slot.end),
          plannedMinutes: chunkMinutes,
          reason: `Scheduled for ${subName} (${item.task.priority} priority, due ${item.task.deadline}) in a conflict-free ${chunkMinutes}m focus block.`,
        });
        remainingToSchedule -= chunkMinutes;
        sessionPart++;
      }
    }
  }

  // 4. Break down large assignment into actionable subtasks
  const breakdownTarget =
    input.assignmentToBreakDown ||
    (scored[0]
      ? {
          title: scored[0].task.title,
          subjectId: scored[0].task.subjectId,
          totalEstimatedMinutes: Math.max(90, scored[0].task.estimatedMinutes),
          deadline: scored[0].task.deadline,
        }
      : {
          title: "Comprehensive Coursework Project",
          subjectId: input.subjects[0]?.id || "general",
          totalEstimatedMinutes: 120,
          deadline: addDaysToDateStr(todayStr, 3),
        });

  const totalMins = Math.max(60, breakdownTarget.totalEstimatedMinutes || 120);
  const step1Mins = Math.round(totalMins * 0.25);
  const step2Mins = Math.round(totalMins * 0.4);
  const step3Mins = Math.round(totalMins * 0.2);
  const step4Mins = Math.max(15, totalMins - step1Mins - step2Mins - step3Mins);

  const breakdownSubtasks: AITaskBreakdownItem[] = [
    {
      title: `${breakdownTarget.title} — Part 1: Scope, Requirements & Outline`,
      estimatedMinutes: step1Mins,
      priority: "high",
      rationale: "Clarifies grading rubric, core concepts, and resource checklist before deep execution.",
    },
    {
      title: `${breakdownTarget.title} — Part 2: Core Problem Solving / Primary Draft`,
      estimatedMinutes: step2Mins,
      priority: "high",
      rationale: "Addresses the highest-weight technical or analytical components during peak focus.",
    },
    {
      title: `${breakdownTarget.title} — Part 3: Verification, Examples & Edge Cases`,
      estimatedMinutes: step3Mins,
      priority: "medium",
      rationale: "Validates calculations, code tests, or argument citations against requirements.",
    },
    {
      title: `${breakdownTarget.title} — Part 4: Final Polish & Submission Check`,
      estimatedMinutes: step4Mins,
      priority: "medium",
      rationale: "Ensures formatting completeness and eliminates last-minute submission errors.",
    },
  ];

  return {
    source: "rule-based-fallback",
    fallbackNotice:
      fallbackReason ||
      "Generated using TIMEWISE Rule-Based Scheduling Engine (External AI API key not configured).",
    prioritizedTasks,
    recommendedSchedule,
    breakdownSubtasks,
    conflictWarnings,
    summaryExplanation: `Analyzed ${pendingTasks.length} active task(s) and ${input.plannerEvents.length} scheduled block(s) against your daily study target of ${dailyCapMinutes} minutes. Tasks were ranked by deadline proximity and priority weight, large assignments were split into manageable <=60m blocks with 15m recovery buffers, and all recommended slots avoid existing calendar collisions.`,
  };
}
