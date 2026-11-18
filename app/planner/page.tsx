"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Plus,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import { PlannerEvent } from "@/types";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import {
  addDaysToDateStr,
  formatLocalDate,
  formatMinutesAsDuration,
  getStartOfWeekDateStr,
  parseTimeToMinutes,
} from "@/lib/utils";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 07:00 to 21:00

export default function PlannerPage() {
  const {
    workspace,
    addPlannerEvent,
    updatePlannerEvent,
    deletePlannerEvent,
  } = useTimewise();

  const todayStr = formatLocalDate();
  const weekStartsOn = workspace?.preferences.weekStartsOn || "monday";

  const [weekStartStr, setWeekStartStr] = useState(() =>
    getStartOfWeekDateStr(new Date(), "monday")
  );
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [selectedDailyDate, setSelectedDailyDate] = useState(todayStr);

  // Modal state for adding/editing session
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<PlannerEvent | null>(null);

  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const weekDays = useMemo(() => {
    const names =
      weekStartsOn === "sunday"
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return names.map((dayName, idx) => {
      const dStr = addDaysToDateStr(weekStartStr, idx);
      return {
        dayName,
        dateStr: dStr,
        dayNumber: dStr.slice(8, 10),
        monthShort: new Date(
          Number(dStr.slice(0, 4)),
          Number(dStr.slice(5, 7)) - 1,
          Number(dStr.slice(8, 10))
        ).toLocaleDateString("en-US", { month: "short" }),
        isToday: dStr === todayStr,
      };
    });
  }, [weekStartStr, weekStartsOn, todayStr]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    workspace?.subjects.forEach((s) =>
      map.set(s.id, { name: s.name, color: s.color })
    );
    return map;
  }, [workspace?.subjects]);

  const taskMap = useMemo(() => {
    const map = new Map<
      string,
      { title: string; estimatedMinutes: number; actualMinutes: number }
    >();
    workspace?.tasks.forEach((t) =>
      map.set(t.id, {
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        actualMinutes: t.actualMinutes,
      })
    );
    return map;
  }, [workspace?.tasks]);

  // Detect overlapping sessions on any visible day
  const overlappingEventIds = useMemo(() => {
    const set = new Set<string>();
    if (!workspace) return set;

    const byDate = new Map<string, PlannerEvent[]>();
    workspace.plannerEvents.forEach((e) => {
      const arr = byDate.get(e.date) || [];
      arr.push(e);
      byDate.set(e.date, arr);
    });

    for (const [, list] of byDate.entries()) {
      const sorted = [...list].sort(
        (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
      );
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          const endA = parseTimeToMinutes(sorted[i].endTime);
          const startB = parseTimeToMinutes(sorted[j].startTime);
          if (endA > startB) {
            set.add(sorted[i].id);
            set.add(sorted[j].id);
          }
        }
      }
    }
    return set;
  }, [workspace]);

  // Check if current modal form overlaps with an existing session on that date
  const modalOverlapWarning = useMemo(() => {
    if (!workspace || !date || !startTime || !endTime) return null;
    const sMins = parseTimeToMinutes(startTime);
    const eMins = parseTimeToMinutes(endTime);
    if (eMins <= sMins) return null;

    const conflicts = workspace.plannerEvents.filter((evt) => {
      if (evt.date !== date) return false;
      if (editingEvent && evt.id === editingEvent.id) return false;
      const evtStart = parseTimeToMinutes(evt.startTime);
      const evtEnd = parseTimeToMinutes(evt.endTime);
      return sMins < evtEnd && eMins > evtStart;
    });

    if (conflicts.length === 0) return null;
    return `Warning: Overlaps with "${conflicts[0].title}" (${conflicts[0].startTime}–${conflicts[0].endTime}).`;
  }, [workspace, date, startTime, endTime, editingEvent]);

  const openNewSessionModal = (defaultDate: string = todayStr, defaultHour?: number) => {
    if (!workspace) return;
    setEditingEvent(null);
    setFormError(null);
    setTitle("");
    setSubjectId(workspace.subjects[0]?.id || "");
    setTaskId("");
    setDate(defaultDate);
    if (defaultHour !== undefined) {
      const sh = String(defaultHour).padStart(2, "0");
      const eh = String(Math.min(23, defaultHour + 1)).padStart(2, "0");
      setStartTime(`${sh}:00`);
      setEndTime(`${eh}:00`);
    } else {
      setStartTime("09:00");
      setEndTime("10:00");
    }
    setNotes("");
    setModalOpen(true);
  };

  const openEditSessionModal = (evt: PlannerEvent) => {
    setEditingEvent(evt);
    setFormError(null);
    setTitle(evt.title);
    setSubjectId(evt.subjectId);
    setTaskId(evt.taskId || "");
    setDate(evt.date);
    setStartTime(evt.startTime);
    setEndTime(evt.endTime);
    setNotes(evt.notes || "");
    setModalOpen(true);
  };

  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (title.trim().length < 2) {
      setFormError("Please enter a study session title.");
      return;
    }
    const sMins = parseTimeToMinutes(startTime);
    const eMins = parseTimeToMinutes(endTime);
    if (eMins <= sMins) {
      setFormError("End time must be later than start time.");
      return;
    }

    try {
      if (editingEvent) {
        updatePlannerEvent(editingEvent.id, {
          title: title.trim(),
          subjectId,
          taskId: taskId || undefined,
          date,
          startTime,
          endTime,
          notes: notes.trim(),
        });
      } else {
        addPlannerEvent({
          title: title.trim(),
          subjectId,
          taskId: taskId || undefined,
          date,
          startTime,
          endTime,
          notes: notes.trim(),
        });
      }
      setModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save study session.");
    }
  };

  const handleTaskSelect = (selectedId: string) => {
    setTaskId(selectedId);
    if (!workspace || !selectedId) return;
    const found = workspace.tasks.find((t) => t.id === selectedId);
    if (found) {
      if (!title.trim()) setTitle(found.title);
      setSubjectId(found.subjectId);
    }
  };

  // Planned vs Estimated vs Actual summary for current visible week
  const weekComparisonRows = useMemo(() => {
    if (!workspace) return [];
    const weekStart = weekDays[0].dateStr;
    const weekEnd = weekDays[6].dateStr;

    const weekEvents = workspace.plannerEvents.filter(
      (e) => e.date >= weekStart && e.date <= weekEnd
    );

    const weekSessions = workspace.focusSessions.filter(
      (s) => s.mode === "focus" && s.date >= weekStart && s.date <= weekEnd
    );

    // Group by task or subject
    return workspace.tasks
      .filter((t) => {
        const hasEvent = weekEvents.some((e) => e.taskId === t.id);
        const hasFocus = weekSessions.some((s) => s.taskId === t.id);
        const dueThisWeek = t.deadline >= weekStart && t.deadline <= weekEnd;
        return hasEvent || hasFocus || dueThisWeek;
      })
      .map((t) => {
        const plannedMinutes = weekEvents
          .filter((e) => e.taskId === t.id)
          .reduce((a, b) => a + b.plannedMinutes, 0);
        const sub = subjectMap.get(t.subjectId);
        return {
          taskId: t.id,
          title: t.title,
          subjectName: sub?.name || "General",
          subjectColor: sub?.color || "#4F46E5",
          estimatedMinutes: t.estimatedMinutes,
          plannedMinutes,
          actualMinutes: t.actualMinutes,
          status: t.status,
        };
      });
  }, [workspace, weekDays, subjectMap]);

  const displayedDays =
    viewMode === "weekly"
      ? weekDays
      : weekDays.filter((d) => d.dateStr === selectedDailyDate);

  return (
    <AppShell>
      {workspace && (
        <div className="space-y-6">
          {/* Top Planner Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Weekly Study Planner
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Schedule structured study sessions and compare planned blocks with estimated and actual recorded focus time.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Prev / Today / Next Controls */}
              <div className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setWeekStartStr(addDaysToDateStr(weekStartStr, -7))
                  }
                  className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const start = getStartOfWeekDateStr(new Date(), weekStartsOn);
                    setWeekStartStr(start);
                    setSelectedDailyDate(todayStr);
                  }}
                  className="px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWeekStartStr(addDaysToDateStr(weekStartStr, 7))
                  }
                  className="rounded-lg p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Weekly vs Daily Toggle */}
              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("weekly")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "weekly"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Weekly View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("daily");
                    if (
                      selectedDailyDate < weekDays[0].dateStr ||
                      selectedDailyDate > weekDays[6].dateStr
                    ) {
                      setSelectedDailyDate(weekDays[0].dateStr);
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    viewMode === "daily"
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  Daily View
                </button>
              </div>

              <button
                type="button"
                onClick={() => openNewSessionModal(todayStr)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Schedule Study Session
              </button>
            </div>
          </div>

          {/* Overlap Warning Banner if any sessions conflict */}
          {overlappingEventIds.size > 0 && (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                <strong>Schedule Overlap Detected:</strong> {overlappingEventIds.size} study sessions have overlapping time ranges. Click a highlighted session to adjust its start or end time.
              </span>
            </div>
          )}

          {/* Day Selector Tabs when in Daily View */}
          {viewMode === "daily" && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {weekDays.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDailyDate(d.dateStr)}
                  className={`flex flex-col items-center rounded-xl border px-4 py-2 text-xs font-semibold transition-colors shrink-0 ${
                    selectedDailyDate === d.dateStr
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : d.isToday
                      ? "border-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span>{d.dayName}</span>
                  <span className="text-sm font-bold">
                    {d.monthShort} {d.dayNumber}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Calendar Grid */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
            {/* Day Column Headers */}
            <div
              className={`grid border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 ${
                viewMode === "weekly"
                  ? "grid-cols-1 md:grid-cols-7"
                  : "grid-cols-1"
              }`}
            >
              {(displayedDays.length > 0 ? displayedDays : [weekDays[0]]).map(
                (day) => {
                  const dayEvents = workspace.plannerEvents
                    .filter((e) => e.date === day.dateStr)
                    .sort((a, b) =>
                      a.startTime.localeCompare(b.startTime)
                    );
                  const totalDayMinutes = dayEvents.reduce(
                    (a, b) => a + b.plannedMinutes,
                    0
                  );

                  return (
                    <div
                      key={day.dateStr}
                      className={`flex flex-col border-b md:border-b-0 md:border-r last:border-r-0 border-slate-200 dark:border-slate-800 min-h-[340px] ${
                        day.isToday
                          ? "bg-indigo-50/20 dark:bg-indigo-950/10"
                          : ""
                      }`}
                    >
                      {/* Column Top Header */}
                      <div
                        className={`flex items-center justify-between px-3.5 py-3 border-b border-slate-200/80 dark:border-slate-800 ${
                          day.isToday
                            ? "bg-indigo-600/10 dark:bg-indigo-500/20"
                            : "bg-slate-50/80 dark:bg-slate-900"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {day.dayName}
                            </span>
                            {day.isToday && (
                              <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                TODAY
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {day.monthShort} {day.dayNumber}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-semibold text-slate-500 block">
                            {formatMinutesAsDuration(totalDayMinutes)}
                          </span>
                          <button
                            type="button"
                            onClick={() => openNewSessionModal(day.dateStr, 9)}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Sessions & Hourly Slots inside the Day Column */}
                      <div className="flex-1 p-2.5 space-y-2">
                        {dayEvents.length === 0 ? (
                          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-4">
                            <p className="text-xs text-slate-400">
                              No study blocks scheduled
                            </p>
                            <button
                              type="button"
                              onClick={() => openNewSessionModal(day.dateStr, 10)}
                              className="mt-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                            >
                              + Schedule Block
                            </button>
                          </div>
                        ) : (
                          dayEvents.map((evt) => {
                            const sub = subjectMap.get(evt.subjectId);
                            const linkedTask = evt.taskId
                              ? taskMap.get(evt.taskId)
                              : undefined;
                            const hasConflict = overlappingEventIds.has(evt.id);

                            return (
                              <div
                                key={evt.id}
                                className={`group rounded-xl border p-2.5 text-xs transition-all shadow-2xs ${
                                  hasConflict
                                    ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40"
                                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-indigo-400"
                                }`}
                                style={{
                                  borderLeftWidth: "4px",
                                  borderLeftColor: sub?.color || "#4F46E5",
                                }}
                              >
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-slate-900 dark:text-white leading-snug">
                                    {evt.title}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-85 group-hover:opacity-100 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openEditSessionModal(evt)}
                                      className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600"
                                      aria-label={`Edit ${evt.title}`}
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingEvent(evt)}
                                      className="rounded p-1 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600"
                                      aria-label={`Delete ${evt.title}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                  <Clock className="h-3 w-3" />
                                  <span>
                                    {evt.startTime} – {evt.endTime} ({evt.plannedMinutes}m)
                                  </span>
                                </div>

                                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                                  <span>{sub?.name || "General"}</span>
                                  {evt.isSample && (
                                    <span className="rounded bg-amber-100 dark:bg-amber-950 px-1 py-0.2 text-amber-800 dark:text-amber-300 font-semibold">
                                      Sample
                                    </span>
                                  )}
                                  {hasConflict && (
                                    <span className="rounded bg-amber-200 text-amber-900 px-1 font-bold">
                                      OVERLAP
                                    </span>
                                  )}
                                </div>

                                {linkedTask && (
                                  <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/70 text-[10px] text-slate-500 flex items-center justify-between">
                                    <span>Est: {linkedTask.estimatedMinutes}m</span>
                                    <span className="font-semibold text-violet-600 dark:text-violet-400">
                                      Actual: {linkedTask.actualMinutes}m
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Quick Hourly Slot Strip in Daily View */}
                        {viewMode === "daily" && (
                          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                              Quick Hourly Time Slots (Click to Schedule)
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              {HOURS.map((hr) => {
                                const label = `${String(hr).padStart(2, "0")}:00`;
                                const hasSlot = dayEvents.some(
                                  (e) =>
                                    parseTimeToMinutes(e.startTime) <= hr * 60 &&
                                    parseTimeToMinutes(e.endTime) > hr * 60
                                );
                                return (
                                  <button
                                    key={hr}
                                    type="button"
                                    onClick={() =>
                                      openNewSessionModal(day.dateStr, hr)
                                    }
                                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium text-left transition-colors ${
                                      hasSlot
                                        ? "border-indigo-200 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300"
                                        : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 text-slate-600 dark:text-slate-400"
                                    }`}
                                  >
                                    {label} {hasSlot ? "• Busy" : "+ Free"}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Planned vs Estimated vs Actual Comparison Table (Section 8) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-indigo-600" />
                  <span>
                    Planned Time vs. Estimated Task Duration vs. Actual Recorded Focus Time
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Scheduled calendar time is distinct from task duration estimates and actual recorded Pomodoro focus sessions.
                </p>
              </div>
            </div>

            {weekComparisonRows.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Link a task to your scheduled study blocks to compare estimated, planned, and actual focus durations.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 pr-4">Task Deliverable</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Estimated Duration</th>
                      <th className="py-2.5 px-3">Scheduled in Planner</th>
                      <th className="py-2.5 px-3">Actual Recorded Focus</th>
                      <th className="py-2.5 pl-3">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {weekComparisonRows.map((row) => {
                      const diff = row.actualMinutes - row.estimatedMinutes;
                      return (
                        <tr key={row.taskId}>
                          <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                            {row.title}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                              style={{ backgroundColor: row.subjectColor }}
                            >
                              {row.subjectName}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {row.estimatedMinutes} mins
                          </td>
                          <td className="py-3 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                            {row.plannedMinutes} mins
                          </td>
                          <td className="py-3 px-3 font-semibold text-violet-600 dark:text-violet-400">
                            {row.actualMinutes} mins
                          </td>
                          <td className="py-3 pl-3">
                            {row.actualMinutes === 0 ? (
                              <span className="text-slate-400">Not focused yet</span>
                            ) : diff === 0 ? (
                              <span className="text-emerald-600 font-semibold">
                                Exact match (0m)
                              </span>
                            ) : diff > 0 ? (
                              <span className="text-amber-600 font-semibold">
                                +{diff}m over estimate
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-semibold">
                                {diff}m under estimate
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add / Edit Planner Session Modal */}
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title={editingEvent ? "Edit Study Session" : "Schedule Study Session"}
            description="Assign a date, start/end time, subject, and optional task link."
          >
            <form onSubmit={handleSaveSession} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {formError}
                </div>
              )}

              {modalOverlapWarning && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{modalOverlapWarning}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link to Existing Task (Optional)
                </label>
                <select
                  value={taskId}
                  onChange={(e) => handleTaskSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">— Standalone Study Session —</option>
                  {workspace.tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (Est. {t.estimatedMinutes}m, Due {t.deadline})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Calculus Problem Set Deep Work"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject *
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  >
                    {workspace.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Session Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Goals or chapter references for this session..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  {editingEvent ? "Update Session" : "Save Session"}
                </button>
              </div>
            </form>
          </Modal>

          <ConfirmDialog
            open={Boolean(deletingEvent)}
            onClose={() => setDeletingEvent(null)}
            onConfirm={() => {
              if (deletingEvent) deletePlannerEvent(deletingEvent.id);
            }}
            title="Remove Study Session"
            message={`Are you sure you want to delete "${deletingEvent?.title}" from your weekly planner?`}
            confirmLabel="Delete Session"
            variant="danger"
          />
        </div>
      )}
    </AppShell>
  );
}
