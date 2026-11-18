"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Plus,
  Sparkles,
  Timer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import {
  addDaysToDateStr,
  formatLocalDate,
  formatMinutesAsDuration,
  getGreetingByHour,
  getStartOfWeekDateStr,
  isTaskOverdue,
} from "@/lib/utils";

export default function DashboardPage() {
  const {
    activeUser,
    isDemo,
    workspace,
    addTask,
    toggleTaskComplete,
  } = useTimewise();

  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const todayStr = formatLocalDate();
  const greeting = getGreetingByHour();
  const formattedHumanDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    workspace?.subjects.forEach((s) =>
      map.set(s.id, { name: s.name, color: s.color })
    );
    return map;
  }, [workspace?.subjects]);

  // Summary metrics calculated strictly from active workspace
  const metrics = useMemo(() => {
    if (!workspace) {
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        upcomingDeadlinesCount: 0,
        totalFocusMinutes: 0,
      };
    }
    const totalTasks = workspace.tasks.length;
    const completedTasks = workspace.tasks.filter(
      (t) => t.status === "completed"
    ).length;
    const pendingTasks = totalTasks - completedTasks;
    const upcomingDeadlinesCount = workspace.tasks.filter(
      (t) => t.status !== "completed" && t.deadline >= todayStr
    ).length;
    const totalFocusMinutes = workspace.focusSessions
      .filter((s) => s.mode === "focus")
      .reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      upcomingDeadlinesCount,
      totalFocusMinutes,
    };
  }, [workspace, todayStr]);

  // Today's Tasks (scheduled today, due today, or high priority in-progress)
  const todaysTasks = useMemo(() => {
    if (!workspace) return [];
    const list = workspace.tasks.filter(
      (t) =>
        t.deadline === todayStr ||
        t.scheduledDate === todayStr ||
        t.status !== "completed"
    );
    return list.slice(0, 6);
  }, [workspace, todayStr]);

  // Chronological upcoming deadlines (including overdue highlighted first)
  const upcomingDeadlines = useMemo(() => {
    if (!workspace) return [];
    return [...workspace.tasks]
      .filter((t) => t.status !== "completed")
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 6);
  }, [workspace]);

  // Weekly Productivity Chart Data (Mon - Sun of current week)
  const weeklyChartData = useMemo(() => {
    if (!workspace) return [];
    const weekStart = getStartOfWeekDateStr(
      new Date(),
      workspace.preferences.weekStartsOn || "monday"
    );
    const dayLabels =
      workspace.preferences.weekStartsOn === "sunday"
        ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    return dayLabels.map((dayName, idx) => {
      const dateStr = addDaysToDateStr(weekStart, idx);
      const plannedMins = workspace.plannerEvents
        .filter((e) => e.date === dateStr)
        .reduce((a, b) => a + (b.plannedMinutes || 0), 0);
      const actualMins = workspace.focusSessions
        .filter((s) => s.date === dateStr && s.mode === "focus")
        .reduce((a, b) => a + (b.durationMinutes || 0), 0);

      return {
        name: dayName,
        date: dateStr,
        "Planned (m)": plannedMins,
        "Actual Focus (m)": actualMins,
      };
    });
  }, [workspace]);

  return (
    <AppShell>
      {workspace && activeUser && (
        <div className="space-y-6">
          {/* Welcome Header & Quick Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>{formattedHumanDate}</span>
                {isDemo && (
                  <span className="rounded bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                    SAMPLE DEMO WORKSPACE
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                {greeting}, {activeUser.fullName}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Daily study target:{" "}
                <strong className="text-slate-900 dark:text-slate-200">
                  {formatMinutesAsDuration(activeUser.dailyStudyGoalMinutes)}
                </strong>{" "}
                • Academic level:{" "}
                <span className="capitalize font-medium text-slate-800 dark:text-slate-200">
                  {activeUser.academicLevel}
                </span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setAddTaskOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                Add New Task
              </button>
              <Link
                href="/planner"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Calendar className="h-4 w-4 text-indigo-600" />
                Open Planner
              </Link>
              <Link
                href="/focus"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Timer className="h-4 w-4 text-violet-600" />
                Start Focus Session
              </Link>
              <Link
                href="/analytics"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                View Analytics
              </Link>
            </div>
          </div>

          {/* 5 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Total Tasks</span>
                <ListTodo className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.totalTasks}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Across {workspace.subjects.length} subjects
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Completed Tasks</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {metrics.completedTasks}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {metrics.totalTasks > 0
                  ? `${Math.round((metrics.completedTasks / metrics.totalTasks) * 100)}% completion rate`
                  : "No tasks logged yet"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Pending Tasks</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.pendingTasks}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Active deliverables
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Upcoming Deadlines</span>
                <Calendar className="h-4 w-4 text-violet-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {metrics.upcomingDeadlinesCount}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Due today or later
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>Focus Time</span>
                <Flame className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatMinutesAsDuration(metrics.totalFocusMinutes)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {workspace.focusSessions.filter((s) => s.mode === "focus").length} focus sessions
              </p>
            </div>
          </div>

          {/* Main Grid: Today's Tasks + Upcoming Deadlines */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's Tasks */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Today&apos;s Priority Tasks
                    </h2>
                    <p className="text-xs text-slate-500">
                      Check off tasks directly as you complete them
                    </p>
                  </div>
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Manage All Tasks
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {todaysTasks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      No tasks in your workspace yet
                    </p>
                    <p className="text-xs text-slate-500">
                      Add your first assignment or revision goal to start planning your week.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddTaskOpen(true)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add First Task
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {todaysTasks.map((task) => {
                      const sub = subjectMap.get(task.subjectId);
                      const overdue = isTaskOverdue(
                        task.deadline,
                        task.status,
                        todayStr
                      );
                      const completed = task.status === "completed";

                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors ${
                            completed
                              ? "border-slate-100 dark:border-slate-800/60 bg-slate-50/60 dark:bg-slate-800/30 opacity-75"
                              : overdue
                              ? "border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={completed}
                              onChange={() => toggleTaskComplete(task.id)}
                              aria-label={`Mark "${task.title}" complete`}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    completed
                                      ? "line-through text-slate-400"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {task.title}
                                </span>
                                {task.isSample && (
                                  <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                    Sample
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                {sub && (
                                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: sub.color }}
                                    />
                                    {sub.name}
                                  </span>
                                )}
                                <span>•</span>
                                <span>Due {task.deadline}</span>
                                <span>•</span>
                                <span>Est. {task.estimatedMinutes}m</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                                task.priority === "high"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : task.priority === "medium"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Upcoming Deadlines
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chronological schedule with overdue highlights
                    </p>
                  </div>
                  <Link
                    href="/assistant"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Optimize with AI
                  </Link>
                </div>

                {upcomingDeadlines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
                    <p className="text-xs text-slate-500">
                      No pending deadlines! All current tasks are completed.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {upcomingDeadlines.map((t) => {
                      const overdue = isTaskOverdue(
                        t.deadline,
                        t.status,
                        todayStr
                      );
                      const isToday = t.deadline === todayStr;
                      const sub = subjectMap.get(t.subjectId);

                      return (
                        <div
                          key={t.id}
                          className={`rounded-xl border p-3.5 flex items-center justify-between gap-3 ${
                            overdue
                              ? "border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30"
                              : isToday
                              ? "border-amber-300 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20"
                              : "border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {overdue && (
                                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                              )}
                              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                                {t.title}
                              </p>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {sub?.name || "General"} • Est. {t.estimatedMinutes}m (Actual {t.actualMinutes}m)
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${
                                overdue
                                  ? "bg-red-600 text-white"
                                  : isToday
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {overdue
                                ? `OVERDUE (${t.deadline})`
                                : isToday
                                ? "DUE TODAY"
                                : t.deadline}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Weekly Productivity Chart */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Weekly Study Productivity (Planned vs. Actual Focus Time)
                </h2>
                <p className="text-xs text-slate-500">
                  Compares scheduled weekly planner blocks against recorded Pomodoro focus sessions (minutes)
                </p>
              </div>
              <Link
                href="/analytics"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Open Detailed Analytics →
              </Link>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyChartData}
                  margin={{ top: 10, right: 16, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="m" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Planned (m)"
                    fill="#4F46E5"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="Actual Focus (m)"
                    fill="#7C3AED"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <TaskFormModal
            open={addTaskOpen}
            onClose={() => setAddTaskOpen(false)}
            subjects={workspace.subjects}
            onSave={(data) => addTask(data)}
          />
        </div>
      )}
    </AppShell>
  );
}
