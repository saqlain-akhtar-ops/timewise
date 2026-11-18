"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Cpu,
  Layers,
  ListChecks,
  Plus,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import {
  AIResponsePayload,
  AIScheduleSuggestion,
  AITaskBreakdownItem,
} from "@/types";
import { addDaysToDateStr, formatLocalDate } from "@/lib/utils";

export default function AssistantPage() {
  const {
    activeUser,
    workspace,
    addPlannerEvent,
    addTask,
  } = useTimewise();

  const todayStr = formatLocalDate();

  // Input Context controls
  const [availableHoursPerDay, setAvailableHoursPerDay] = useState<number>(3);
  const [preferredStartHour, setPreferredStartHour] = useState<number>(9);

  // Assignment Breakdown Form
  const [breakdownTitle, setBreakdownTitle] = useState(
    "Final Software Engineering Capstone Report"
  );
  const [breakdownSubjectId, setBreakdownSubjectId] = useState("");
  const [breakdownMinutes, setBreakdownMinutes] = useState(180);
  const [breakdownDeadline, setBreakdownDeadline] = useState(
    addDaysToDateStr(todayStr, 5)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponsePayload | null>(null);

  // Track which individual suggestions the student has approved & applied
  const [approvedScheduleIds, setApprovedScheduleIds] = useState<Set<string>>(
    new Set()
  );
  const [approvedSubtaskIndexes, setApprovedSubtaskIndexes] = useState<
    Set<number>
  >(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleGenerateRecommendations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!workspace || !activeUser) return;

    setLoading(true);
    setError(null);
    setFeedbackMsg(null);
    setApprovedScheduleIds(new Set());
    setApprovedSubtaskIndexes(new Set());

    try {
      const targetSubId =
        breakdownSubjectId || workspace.subjects[0]?.id || "general";
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: workspace.tasks,
          subjects: workspace.subjects,
          plannerEvents: workspace.plannerEvents,
          dailyStudyGoalMinutes: activeUser.dailyStudyGoalMinutes,
          availableHoursPerDay,
          preferredStartHour,
          assignmentToBreakDown: breakdownTitle.trim()
            ? {
                title: breakdownTitle.trim(),
                subjectId: targetSubId,
                totalEstimatedMinutes: breakdownMinutes,
                deadline: breakdownDeadline,
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate recommendations.");
      }

      setResult(data as AIResponsePayload);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach the AI Study Assistant endpoint."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSingleSchedule = (item: AIScheduleSuggestion) => {
    if (approvedScheduleIds.has(item.id)) return;
    try {
      addPlannerEvent({
        title: item.title,
        subjectId: item.subjectId,
        taskId: item.taskId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        notes: `AI Assistant Recommendation: ${item.reason}`,
      });
      const next = new Set(approvedScheduleIds);
      next.add(item.id);
      setApprovedScheduleIds(next);
      setFeedbackMsg(`Added "${item.title}" (${item.date} ${item.startTime}) to your Weekly Planner.`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not add session to planner."
      );
    }
  };

  const handleApproveAllSchedules = () => {
    if (!result) return;
    const next = new Set(approvedScheduleIds);
    let addedCount = 0;
    for (const item of result.recommendedSchedule) {
      if (!next.has(item.id)) {
        try {
          addPlannerEvent({
            title: item.title,
            subjectId: item.subjectId,
            taskId: item.taskId,
            date: item.date,
            startTime: item.startTime,
            endTime: item.endTime,
            notes: `AI Assistant Recommendation: ${item.reason}`,
          });
          next.add(item.id);
          addedCount++;
        } catch {
          // ignore invalid range
        }
      }
    }
    setApprovedScheduleIds(next);
    if (addedCount > 0) {
      setFeedbackMsg(
        `Approved and added ${addedCount} recommended study session(s) to your Weekly Planner.`
      );
    }
  };

  const handleApproveSubtask = (subtask: AITaskBreakdownItem, idx: number) => {
    if (!workspace || approvedSubtaskIndexes.has(idx)) return;
    const targetSubId =
      breakdownSubjectId || workspace.subjects[0]?.id || "general";
    addTask({
      title: subtask.title,
      description: subtask.rationale,
      subjectId: targetSubId,
      priority: subtask.priority,
      status: "not-started",
      deadline: breakdownDeadline || addDaysToDateStr(todayStr, 3),
      estimatedMinutes: subtask.estimatedMinutes,
      notes: "Created via AI Assignment Breakdown",
    });
    const next = new Set(approvedSubtaskIndexes);
    next.add(idx);
    setApprovedSubtaskIndexes(next);
    setFeedbackMsg(`Approved and added subtask "${subtask.title}" to My Tasks.`);
  };

  return (
    <AppShell>
      {workspace && activeUser && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-indigo-600" />
                <span>AI Study Assistant & Schedule Optimizer</span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Generate realistic study schedules, prioritize urgent tasks, resolve deadline conflicts, and break down large assignments. All suggestions require your explicit approval before modifying your workspace.
              </p>
            </div>
          </div>

          {/* Configuration & Assignment Breakdown Input Panel */}
          <form
            onSubmit={handleGenerateRecommendations}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Workload & Availability Context */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                1. Workload & Study Availability
              </h2>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3.5 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <p>
                  • <strong>Pending Workspace Tasks:</strong>{" "}
                  {workspace.tasks.filter((t) => t.status !== "completed").length}{" "}
                  tasks
                </p>
                <p>
                  • <strong>Existing Planner Sessions:</strong>{" "}
                  {workspace.plannerEvents.length} blocks
                </p>
                <p>
                  • <strong>Daily Study Goal:</strong>{" "}
                  {activeUser.dailyStudyGoalMinutes} minutes/day
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Available Study Hours / Day
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    step={0.5}
                    value={availableHoursPerDay}
                    onChange={(e) =>
                      setAvailableHoursPerDay(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Start Hour
                  </label>
                  <select
                    value={preferredStartHour}
                    onChange={(e) =>
                      setPreferredStartHour(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    <option value={8}>08:00 AM</option>
                    <option value={9}>09:00 AM</option>
                    <option value={10}>10:00 AM</option>
                    <option value={13}>01:00 PM</option>
                    <option value={16}>04:00 PM</option>
                    <option value={18}>06:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right: Assignment Breakdown Input */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  2. Large Assignment Breakdown Input
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assignment or Project Title to Deconstruct
                    </label>
                    <input
                      type="text"
                      value={breakdownTitle}
                      onChange={(e) => setBreakdownTitle(e.target.value)}
                      placeholder="e.g., Complete Web Development Project or Research Essay"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={breakdownSubjectId || workspace.subjects[0]?.id || ""}
                      onChange={(e) => setBreakdownSubjectId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                    >
                      {workspace.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Total Est. (Mins)
                      </label>
                      <input
                        type="number"
                        min={30}
                        max={600}
                        step={15}
                        value={breakdownMinutes}
                        onChange={(e) =>
                          setBreakdownMinutes(Number(e.target.value))
                        }
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Target Deadline
                      </label>
                      <input
                        type="date"
                        value={breakdownDeadline}
                        onChange={(e) => setBreakdownDeadline(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Sparkles className="h-4 w-4" />
                  {loading
                    ? "Analyzing Workload & Generating Plan..."
                    : "Generate Study Plan & Recommendations"}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {feedbackMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-3.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-6">
              {/* Honest AI vs Rule-Based Source Badge */}
              <div
                className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                  result.source === "ai"
                    ? "border-indigo-200 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/40"
                    : "border-violet-200 bg-violet-50/70 dark:border-violet-800 dark:bg-violet-950/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      {result.source === "ai"
                        ? `Generated by External AI (${result.providerName} — ${result.modelName})`
                        : "Generated by TIMEWISE Rule-Based Study Engine (Fallback Mode)"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {result.summaryExplanation}
                  </p>
                  {result.fallbackNotice && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Note: {result.fallbackNotice}
                    </p>
                  )}
                </div>
              </div>

              {/* Conflict Warnings & Schedule Optimization */}
              {result.conflictWarnings.length > 0 && (
                <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-amber-950 dark:text-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Schedule Optimization & Conflict Warnings</span>
                  </div>
                  <div className="space-y-2">
                    {result.conflictWarnings.map((w, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-white dark:bg-slate-900 p-3.5 border border-amber-200 dark:border-amber-800/80 text-xs space-y-1"
                      >
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {w.message}
                        </p>
                        <p className="text-amber-800 dark:text-amber-300">
                          <strong>Recommended Adjustment:</strong>{" "}
                          {w.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recommended Study Schedule with Approval Buttons */}
                <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CalendarPlus className="h-4 w-4 text-indigo-600" />
                        <span>Recommended Study Schedule</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Review and approve individual sessions to add them to your Weekly Planner.
                      </p>
                    </div>
                    {result.recommendedSchedule.length > 0 && (
                      <button
                        type="button"
                        onClick={handleApproveAllSchedules}
                        className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        Approve & Add All ({result.recommendedSchedule.length})
                      </button>
                    )}
                  </div>

                  {result.recommendedSchedule.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">
                      No pending tasks require new study blocks right now.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {result.recommendedSchedule.map((item) => {
                        const isApproved = approvedScheduleIds.has(item.id);
                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.title}
                              </p>
                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                {item.date} • {item.startTime} – {item.endTime} (
                                {item.plannedMinutes} mins)
                              </p>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                <strong>Why recommended:</strong> {item.reason}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={isApproved}
                              onClick={() => handleApproveSingleSchedule(item)}
                              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90"
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approved & Added
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3.5 w-3.5" />
                                  Approve Block
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Task Prioritization + Assignment Breakdown */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Prioritized Tasks */}
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-violet-600" />
                      <span>Recommended Task Priority Order</span>
                    </h3>
                    {result.prioritizedTasks.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No pending tasks to rank.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {result.prioritizedTasks.map((pt) => (
                          <div
                            key={pt.taskId}
                            className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white">
                                #{pt.rank} — {pt.title}
                              </span>
                              <span className="rounded bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                                Urgency {pt.urgencyScore}/100
                              </span>
                            </div>
                            <p className="text-slate-500">{pt.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assignment Breakdown Subtasks */}
                  {result.breakdownSubtasks && (
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Layers className="h-4 w-4 text-emerald-600" />
                          <span>Actionable Subtask Breakdown</span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Approve any milestone below to add it directly to My Tasks.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {result.breakdownSubtasks.map((sub, idx) => {
                          const isAdded = approvedSubtaskIndexes.has(idx);
                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 text-xs space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {sub.title}
                                </span>
                                <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold shrink-0">
                                  {sub.estimatedMinutes}m
                                </span>
                              </div>
                              <p className="text-slate-500">{sub.rationale}</p>
                              <button
                                type="button"
                                disabled={isAdded}
                                onClick={() => handleApproveSubtask(sub, idx)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  isAdded
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Added to My Tasks
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3.5 w-3.5" />
                                    Approve & Create Task
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
