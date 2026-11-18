"use client";

import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Info,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import {
  AnalyticsFilterRange,
  calculateFocusAnalytics,
  calculatePlanningAccuracy,
  calculateSubjectAnalytics,
  calculateTaskCompletionMetrics,
  resolveDateRangeBounds,
} from "@/lib/analytics";
import { addDaysToDateStr, formatLocalDate, formatMinutesAsDuration } from "@/lib/utils";

export default function AnalyticsPage() {
  const { workspace, isDemo } = useTimewise();

  const todayStr = formatLocalDate();
  const [range, setRange] = useState<AnalyticsFilterRange>("7days");
  const [customStart, setCustomStart] = useState(() =>
    addDaysToDateStr(todayStr, -13)
  );
  const [customEnd, setCustomEnd] = useState(todayStr);

  const bounds = useMemo(
    () => resolveDateRangeBounds(range, todayStr, customStart, customEnd),
    [range, todayStr, customStart, customEnd]
  );

  const completionMetrics = useMemo(() => {
    if (!workspace) return null;
    return calculateTaskCompletionMetrics(workspace.tasks, bounds, todayStr);
  }, [workspace, bounds, todayStr]);

  const focusMetrics = useMemo(() => {
    if (!workspace) return null;
    return calculateFocusAnalytics(
      workspace.focusSessions,
      workspace.plannerEvents,
      bounds
    );
  }, [workspace, bounds]);

  const subjectMetrics = useMemo(() => {
    if (!workspace) return [];
    return calculateSubjectAnalytics(workspace, bounds);
  }, [workspace, bounds]);

  const planningAccuracy = useMemo(() => {
    if (!workspace) return null;
    return calculatePlanningAccuracy(
      workspace.tasks,
      workspace.subjects,
      bounds
    );
  }, [workspace, bounds]);

  const activeSubjectsForPie = useMemo(
    () => subjectMetrics.filter((s) => s.actualFocusMinutes > 0),
    [subjectMetrics]
  );

  return (
    <AppShell>
      {workspace && completionMetrics && focusMetrics && planningAccuracy && (
        <div className="space-y-6">
          {/* Header & Date Range Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Productivity & Learning Analytics
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Reporting Period: <strong>{bounds.label}</strong>
                {isDemo && " (Calculated from Shared Demo Sample Dataset)"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                {(
                  [
                    { id: "today", label: "Today" },
                    { id: "7days", label: "Last 7 Days" },
                    { id: "30days", label: "Last 30 Days" },
                    { id: "custom", label: "Custom Range" },
                  ] as const
                ).map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setRange(btn.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      range === btn.id
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {range === "custom" && (
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    aria-label="Custom start date"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    aria-label="Custom end date"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section A & C Top Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Completion Rate Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Task Completion Rate</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {completionMetrics.completionRate}%
              </p>
              <p className="text-xs text-slate-500">
                {completionMetrics.completedTasks} completed /{" "}
                {completionMetrics.totalPlannedTasks} planned ({completionMetrics.overdueTasks} overdue)
              </p>
            </div>

            {/* Focus Sessions Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Focused Time</span>
                <Flame className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {formatMinutesAsDuration(focusMetrics.totalFocusedMinutes)}
              </p>
              <p className="text-xs text-slate-500">
                Across {focusMetrics.totalCompletedSessions} completed focus sessions
              </p>
            </div>

            {/* Average Focus Duration Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Avg. Session Duration</span>
                <Clock className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {focusMetrics.averageSessionDuration}m
              </p>
              <p className="text-xs text-slate-500">
                Per completed Pomodoro focus block
              </p>
            </div>

            {/* Planning Accuracy Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Planning Accuracy (Est. Metric)</span>
                <Target className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-3xl font-extrabold text-emerald-600">
                {planningAccuracy.averagePlanningAccuracy !== null
                  ? `${planningAccuracy.averagePlanningAccuracy}%`
                  : "N/A"}
              </p>
              <p className="text-xs text-slate-500">
                {planningAccuracy.evaluatedTasksCount > 0
                  ? `Evaluated on ${planningAccuracy.evaluatedTasksCount} task(s) with Est & Actual > 0`
                  : "Requires tasks with both estimated & actual > 0m"}
              </p>
            </div>
          </div>

          {/* Charts Row 1: Daily Planned vs Actual BarChart + Daily Focus Trend LineChart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Planned vs Actual Study Time Bar Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Planned Study Time vs. Actual Recorded Focus Time
                </h2>
                <p className="text-xs text-slate-500">
                  Daily comparison (in minutes) across {bounds.label}
                </p>
              </div>

              {focusMetrics.dailyTrends.every(
                (d) => d.plannedMinutes === 0 && d.focusedMinutes === 0
              ) ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No planned or focused time recorded in this period
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Schedule sessions in the Weekly Planner or complete a Pomodoro session in Focus Room.
                  </p>
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusMetrics.dailyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="m" />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="plannedMinutes"
                        name="Planned Schedule (m)"
                        fill="#4F46E5"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="focusedMinutes"
                        name="Actual Focus (m)"
                        fill="#7C3AED"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Daily Focus Trend Line Chart */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Focus Consistency Trend
                </h2>
                <p className="text-xs text-slate-500">
                  Focused minutes logged per day
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={focusMetrics.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="m" />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="focusedMinutes"
                      name="Focused Minutes"
                      stroke="#16A34A"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts Row 2: Subject-wise Comparisons & Time Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Subject-wise Estimated vs. Actual Study Time
                </h2>
                <p className="text-xs text-slate-500">
                  Compares task duration estimates, scheduled planner blocks, and actual focus minutes by subject
                </p>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subjectMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="subjectName" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="m" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="estimatedTaskMinutes"
                      name="Estimated Task Mins"
                      fill="#94A3B8"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="plannedScheduleMinutes"
                      name="Scheduled Planner Mins"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actualFocusMinutes"
                      name="Actual Focus Mins"
                      fill="#16A34A"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Subject Focus Share
                </h2>
                <p className="text-xs text-slate-500">
                  Which subjects receive the most recorded study time
                </p>
              </div>

              {activeSubjectsForPie.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-center text-xs text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4">
                  Complete at least one focus session in this date range to view subject share distribution.
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activeSubjectsForPie}
                        dataKey="actualFocusMinutes"
                        nameKey="subjectName"
                        cx="50%"
                        cy="50%"
                        outerRadius={85}
                        label={({ name, value }) => `${name}: ${value}m`}
                      >
                        {activeSubjectsForPie.map((entry) => (
                          <Cell key={entry.subjectId} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Section F: Planning Accuracy Detailed Breakdown */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Task Estimation & Planning Accuracy Breakdown
                </h2>
                <p className="text-xs text-slate-500">
                  Formula: Absolute Error = |Actual − Estimated| • Percentage Error = (Absolute Error / Estimated) × 100 • Planning Accuracy = max(0, 100 − Percentage Error)
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 text-xs text-indigo-900 dark:text-indigo-200 shrink-0">
                <Info className="h-4 w-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Estimation Metric Notice:</strong> This measures time-estimation calibration, not intelligence or academic grade performance.
                </span>
              </div>
            </div>

            {planningAccuracy.items.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No tasks in the selected period have both a valid Estimated Duration (&gt; 0m) and Actual Recorded Focus Time (&gt; 0m).
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px]">
                      <th className="py-2.5 pr-4">Task Title</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Estimated</th>
                      <th className="py-2.5 px-3">Actual</th>
                      <th className="py-2.5 px-3">Abs. Error</th>
                      <th className="py-2.5 px-3">% Error</th>
                      <th className="py-2.5 pl-3">Planning Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {planningAccuracy.items.map((item) => (
                      <tr key={item.taskId}>
                        <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {item.subjectName}
                        </td>
                        <td className="py-3 px-3">{item.estimatedMinutes}m</td>
                        <td className="py-3 px-3">{item.actualMinutes}m</td>
                        <td className="py-3 px-3">{item.absoluteErrorMinutes}m</td>
                        <td className="py-3 px-3">{item.percentageError}%</td>
                        <td className="py-3 pl-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 font-bold ${
                              item.planningAccuracy >= 75
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : item.planningAccuracy >= 50
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {item.planningAccuracy}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
