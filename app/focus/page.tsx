"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Coffee,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import { FocusModeType } from "@/types";
import { generateId } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

function FocusRoomContent() {
  const searchParams = useSearchParams();
  const initialTaskIdParam = searchParams.get("taskId") || "";

  const {
    workspace,
    recordCompletedFocusSession,
    updatePreferences,
  } = useTimewise();

  const prefs = workspace?.preferences;
  const focusMins = prefs?.focusDurationMinutes || 25;
  const shortBreakMins = prefs?.shortBreakMinutes || 5;
  const longBreakMins = prefs?.longBreakMinutes || 15;
  const intervalTarget = prefs?.sessionsBeforeLongBreak || 4;

  const [mode, setMode] = useState<FocusModeType>("focus");
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskIdParam);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const getModeDurationSeconds = useCallback(
    (m: FocusModeType) => {
      if (m === "focus") return focusMins * 60;
      if (m === "short-break") return shortBreakMins * 60;
      return longBreakMins * 60;
    },
    [focusMins, shortBreakMins, longBreakMins]
  );

  const [totalSeconds, setTotalSeconds] = useState<number>(() => focusMins * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    () => focusMins * 60
  );
  const [completedFocusCycleCount, setCompletedFocusCycleCount] = useState(0);
  const [completionBanner, setCompletionBanner] = useState<{
    mode: FocusModeType;
    durationMinutes: number;
    nextMode: FocusModeType;
  } | null>(null);

  // Customize Timer Modal
  const [configOpen, setConfigOpen] = useState(false);
  const [customFocus, setCustomFocus] = useState(focusMins);
  const [customShort, setCustomShort] = useState(shortBreakMins);
  const [customLong, setCustomLong] = useState(longBreakMins);
  const [customInterval, setCustomInterval] = useState(intervalTarget);

  // Timestamp-based refs
  const targetEndTimestampRef = useRef<number | null>(null);
  const startedAtIsoRef = useRef<string | null>(null);
  const activeRunIdRef = useRef<string | null>(null);
  const recordedRunIdsRef = useRef<Set<string>>(new Set());

  // Sync URL taskId parameter if provided
  useEffect(() => {
    if (initialTaskIdParam) {
      setSelectedTaskId(initialTaskIdParam);
    }
  }, [initialTaskIdParam]);

  // Update timer duration if user changes preferences while idle
  useEffect(() => {
    if (!isRunning && !isPaused) {
      const secs = getModeDurationSeconds(mode);
      setTotalSeconds(secs);
      setRemainingSeconds(secs);
    }
  }, [focusMins, shortBreakMins, longBreakMins, mode, isRunning, isPaused, getModeDurationSeconds]);

  const handleModeSwitch = (nextMode: FocusModeType) => {
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimestampRef.current = null;
    startedAtIsoRef.current = null;
    activeRunIdRef.current = null;
    setMode(nextMode);
    const secs = getModeDurationSeconds(nextMode);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const finalizeSessionCompletion = useCallback(() => {
    const runId = activeRunIdRef.current;
    if (!runId || recordedRunIdsRef.current.has(runId)) return;
    recordedRunIdsRef.current.add(runId);

    setIsRunning(false);
    setIsPaused(false);
    targetEndTimestampRef.current = null;

    const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));
    const completedIso = new Date().toISOString();
    const startedIso =
      startedAtIsoRef.current ||
      new Date(Date.now() - totalSeconds * 1000).toISOString();

    recordCompletedFocusSession({
      sessionKey: runId,
      taskId: selectedTaskId || undefined,
      mode,
      durationMinutes,
      startedAt: startedIso,
      completedAt: completedIso,
      notes: sessionNotes.trim() || undefined,
    });

    let nextSuggestedMode: FocusModeType = "focus";
    if (mode === "focus") {
      const nextCount = completedFocusCycleCount + 1;
      setCompletedFocusCycleCount(nextCount);
      nextSuggestedMode =
        nextCount % intervalTarget === 0 ? "long-break" : "short-break";
    } else {
      nextSuggestedMode = "focus";
    }

    setCompletionBanner({
      mode,
      durationMinutes,
      nextMode: nextSuggestedMode,
    });
  }, [
    totalSeconds,
    recordCompletedFocusSession,
    selectedTaskId,
    mode,
    sessionNotes,
    completedFocusCycleCount,
    intervalTarget,
  ]);

  // Timestamp-based interval ticker
  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      if (!targetEndTimestampRef.current) return;
      const now = Date.now();
      const diffSeconds = Math.max(
        0,
        Math.ceil((targetEndTimestampRef.current - now) / 1000)
      );
      setRemainingSeconds(diffSeconds);
      if (diffSeconds <= 0) {
        finalizeSessionCompletion();
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [isRunning, finalizeSessionCompletion]);

  const handleStart = () => {
    setCompletionBanner(null);
    const secs = getModeDurationSeconds(mode);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
    startedAtIsoRef.current = new Date().toISOString();
    activeRunIdRef.current = generateId("focusrun");
    targetEndTimestampRef.current = Date.now() + secs * 1000;
    setIsPaused(false);
    setIsRunning(true);
  };

  const handlePause = () => {
    if (!isRunning) return;
    if (targetEndTimestampRef.current) {
      const left = Math.max(
        0,
        Math.ceil((targetEndTimestampRef.current - Date.now()) / 1000)
      );
      setRemainingSeconds(left);
    }
    targetEndTimestampRef.current = null;
    setIsRunning(false);
    setIsPaused(true);
  };

  const handleResume = () => {
    if (!isPaused || remainingSeconds <= 0) return;
    targetEndTimestampRef.current = Date.now() + remainingSeconds * 1000;
    setIsPaused(false);
    setIsRunning(true);
  };

  const handleReset = () => {
    // Incomplete sessions are NOT recorded
    setIsRunning(false);
    setIsPaused(false);
    targetEndTimestampRef.current = null;
    startedAtIsoRef.current = null;
    activeRunIdRef.current = null;
    const secs = getModeDurationSeconds(mode);
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  const handleSkip = () => {
    // Skipping an incomplete session moves to next mode without recording a fake completed session
    const nextMode: FocusModeType =
      mode === "focus" ? "short-break" : "focus";
    handleModeSwitch(nextMode);
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const f = Math.max(1, Math.min(180, Number(customFocus) || 25));
    const s = Math.max(1, Math.min(60, Number(customShort) || 5));
    const l = Math.max(1, Math.min(90, Number(customLong) || 15));
    const iv = Math.max(1, Math.min(12, Number(customInterval) || 4));
    updatePreferences({
      focusDurationMinutes: f,
      shortBreakMinutes: s,
      longBreakMinutes: l,
      sessionsBeforeLongBreak: iv,
    });
    setConfigOpen(false);
  };

  const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const ss = String(remainingSeconds % 60).padStart(2, "0");
  const progressFraction =
    totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressFraction * 100)));

  // Circular SVG metrics
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  const selectedTask = useMemo(
    () => workspace?.tasks.find((t) => t.id === selectedTaskId),
    [workspace?.tasks, selectedTaskId]
  );

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    workspace?.subjects.forEach((s) =>
      map.set(s.id, { name: s.name, color: s.color })
    );
    return map;
  }, [workspace?.subjects]);

  if (!workspace) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Focus Room — Pomodoro Study Timer
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Timestamp-accurate focus timer. Completed sessions automatically update your task duration and productivity analytics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCustomFocus(focusMins);
            setCustomShort(shortBreakMins);
            setCustomLong(longBreakMins);
            setCustomInterval(intervalTarget);
            setConfigOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start"
        >
          <Settings2 className="h-4 w-4 text-indigo-600" />
          Customize Durations
        </button>
      </div>

      {/* Completion Notification Banner */}
      {completionBanner && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                Session Complete! Recorded {completionBanner.durationMinutes} minutes ({completionBanner.mode}).
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Your focus history and task actual time have been updated. Ready for your next interval?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const next = completionBanner.nextMode;
              setCompletionBanner(null);
              handleModeSwitch(next);
            }}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shrink-0"
          >
            Switch to{" "}
            {completionBanner.nextMode === "focus"
              ? "Focus Session"
              : completionBanner.nextMode === "short-break"
              ? "Short Break"
              : "Long Break"}{" "}
            →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Circular Timer Panel */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xs flex flex-col items-center space-y-6">
          {/* Mode Tabs */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1.5 gap-1">
            {(
              [
                { id: "focus", label: `Focus (${focusMins}m)`, icon: Flame },
                {
                  id: "short-break",
                  label: `Short Break (${shortBreakMins}m)`,
                  icon: Coffee,
                },
                {
                  id: "long-break",
                  label: `Long Break (${longBreakMins}m)`,
                  icon: Sparkles,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleModeSwitch(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Circular Countdown SVG */}
          <div className="relative flex items-center justify-center">
            <svg className="h-72 w-72 -rotate-90 transform" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-100 dark:text-slate-800"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                stroke={
                  mode === "focus"
                    ? "#4F46E5"
                    : mode === "short-break"
                    ? "#16A34A"
                    : "#7C3AED"
                }
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                {mode === "focus"
                  ? "DEEP FOCUS SESSION"
                  : mode === "short-break"
                  ? "SHORT REST BREAK"
                  : "RESTORATIVE LONG BREAK"}
              </span>
              <span
                className="mt-1 text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono"
                aria-live="polite"
              >
                {mm}:{ss}
              </span>
              <span className="mt-2 text-xs font-medium text-slate-500">
                {progressPercent}% elapsed • Cycle {completedFocusCycleCount % intervalTarget} / {intervalTarget}
              </span>
            </div>
          </div>

          {/* Selected Task Pill */}
          <div className="w-full max-w-md space-y-3">
            <div>
              <label
                htmlFor="focus-task-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Associated Academic Task
              </label>
              <select
                id="focus-task-select"
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                <option value="">— General Unlinked Focus Session —</option>
                {workspace.tasks
                  .filter((t) => t.status !== "completed")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} (Est: {t.estimatedMinutes}m | Actual: {t.actualMinutes}m)
                    </option>
                  ))}
              </select>
            </div>

            {selectedTask && (
              <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 px-3.5 py-2.5 text-xs flex items-center justify-between">
                <span className="font-semibold text-indigo-950 dark:text-indigo-200 truncate">
                  Active Target: {selectedTask.title}
                </span>
                <span className="text-indigo-700 dark:text-indigo-300 shrink-0 ml-2 font-medium">
                  {selectedTask.actualMinutes}m / {selectedTask.estimatedMinutes}m
                </span>
              </div>
            )}

            <div>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Optional session goal or reflection note..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Primary Controls: Start, Pause, Resume, Reset, Skip */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isRunning && !isPaused && (
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                Start Session
              </button>
            )}

            {isRunning && (
              <button
                type="button"
                onClick={handlePause}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3 text-sm font-bold text-white hover:bg-amber-600 transition-colors shadow-sm"
              >
                <Pause className="h-4 w-4 fill-current" />
                Pause
              </button>
            )}

            {isPaused && (
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Play className="h-4 w-4 fill-current" />
                Resume
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <SkipForward className="h-4 w-4" />
              Skip Session
            </button>
          </div>
        </div>

        {/* Right Column: Session History & Stats */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Focus Room Summary
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
                <p className="text-xs text-slate-500">Completed Sessions</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {workspace.focusSessions.filter((s) => s.mode === "focus").length}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
                <p className="text-xs text-slate-500">Total Focus Minutes</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                  {workspace.focusSessions
                    .filter((s) => s.mode === "focus")
                    .reduce((a, b) => a + b.durationMinutes, 0)}
                  m
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Recent Recorded Focus Sessions
              </h3>
              {workspace.focusSessions.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No completed sessions recorded yet. Start the timer above to log your first deep work block!
                </p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {workspace.focusSessions.slice(0, 10).map((sess) => {
                    const task = workspace.tasks.find((t) => t.id === sess.taskId);
                    const sub = sess.subjectId
                      ? subjectMap.get(sess.subjectId)
                      : undefined;
                    return (
                      <div
                        key={sess.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {task ? task.title : "General Focus Session"}
                            </span>
                            {sess.isSample && (
                              <span className="rounded bg-amber-100 dark:bg-amber-950 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                                Sample
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {sub ? `${sub.name} • ` : ""}
                            {sess.date}
                            {sess.notes ? ` — "${sess.notes}"` : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 font-bold text-indigo-700 dark:text-indigo-300 shrink-0">
                          <Clock className="h-3 w-3" />
                          {sess.durationMinutes}m
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customize Timer Modal */}
      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Customize Pomodoro Timer"
        description="Configure focus and break intervals to match your personal study rhythm."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveCustomConfig} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Focus Duration (mins)
              </label>
              <input
                type="number"
                min={1}
                max={180}
                required
                value={customFocus}
                onChange={(e) => setCustomFocus(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Short Break (mins)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                required
                value={customShort}
                onChange={(e) => setCustomShort(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Long Break (mins)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                required
                value={customLong}
                onChange={(e) => setCustomLong(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sessions Before Long Break
              </label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={customInterval}
                onChange={(e) => setCustomInterval(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConfigOpen(false)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Save Timer Settings
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function FocusPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="p-8 text-center text-sm text-slate-500">
            Loading Focus Room...
          </div>
        }
      >
        <FocusRoomContent />
      </Suspense>
    </AppShell>
  );
}
