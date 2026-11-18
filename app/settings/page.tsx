"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  LogOut,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  User,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import { AcademicLevel } from "@/types";
import { ConfirmDialog } from "@/components/ui/modal";

export default function SettingsPage() {
  const router = useRouter();
  const {
    activeUser,
    isDemo,
    workspace,
    updateStudentProfile,
    updatePreferences,
    resetCurrentStudentWorkspace,
    resetDemo,
    logout,
  } = useTimewise();

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [academicLevel, setAcademicLevel] =
    useState<AcademicLevel>("undergraduate");
  const [dailyStudyGoalMinutes, setDailyStudyGoalMinutes] = useState(120);

  // Timer & Preferences fields
  const [focusDurationMinutes, setFocusDurationMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [sessionsBeforeLongBreak, setSessionsBeforeLongBreak] = useState(4);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weekStartsOn, setWeekStartsOn] = useState<"monday" | "sunday">(
    "monday"
  );

  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    if (!activeUser || !workspace) return;
    setFullName(activeUser.fullName);
    setEmail(activeUser.email);
    setAcademicLevel(activeUser.academicLevel);
    setDailyStudyGoalMinutes(activeUser.dailyStudyGoalMinutes);

    const p = workspace.preferences;
    setFocusDurationMinutes(p.focusDurationMinutes);
    setShortBreakMinutes(p.shortBreakMinutes);
    setLongBreakMinutes(p.longBreakMinutes);
    setSessionsBeforeLongBreak(p.sessionsBeforeLongBreak);
    setTheme(p.theme);
    setNotificationsEnabled(p.notificationsEnabled);
    setWeekStartsOn(p.weekStartsOn);
  }, [activeUser, workspace]);

  const notifySaved = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 3500);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      notifySaved(
        "Demo profile identity is read-only. Create a personal student account to customize profile identity."
      );
      return;
    }
    updateStudentProfile({
      fullName,
      email,
      academicLevel,
      dailyStudyGoalMinutes,
    });
    notifySaved("Student profile saved successfully.");
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      focusDurationMinutes: Math.max(1, Math.min(180, Number(focusDurationMinutes) || 25)),
      shortBreakMinutes: Math.max(1, Math.min(60, Number(shortBreakMinutes) || 5)),
      longBreakMinutes: Math.max(1, Math.min(90, Number(longBreakMinutes) || 15)),
      sessionsBeforeLongBreak: Math.max(
        1,
        Math.min(12, Number(sessionsBeforeLongBreak) || 4)
      ),
      theme,
      notificationsEnabled,
      weekStartsOn,
    });
    notifySaved("Timer and workspace preferences updated.");
  };

  const handleExportJSON = () => {
    if (!workspace || !activeUser) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      mode: isDemo ? "demo" : "student",
      student: {
        id: activeUser.id,
        fullName: activeUser.fullName,
        email: activeUser.email,
        academicLevel: activeUser.academicLevel,
        dailyStudyGoalMinutes: activeUser.dailyStudyGoalMinutes,
      },
      workspace,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timewise_workspace_${activeUser.id}_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySaved("Exported complete workspace data as JSON.");
  };

  const handleExportCSV = () => {
    if (!workspace || !activeUser) return;
    const subMap = new Map(workspace.subjects.map((s) => [s.id, s.name]));
    const rows: string[][] = [
      [
        "RecordType",
        "ID",
        "Title",
        "Subject",
        "PriorityOrMode",
        "Status",
        "DateOrDeadline",
        "EstimatedOrPlannedMinutes",
        "ActualMinutes",
      ],
    ];

    for (const t of workspace.tasks) {
      rows.push([
        "Task",
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(subMap.get(t.subjectId) || "General").replace(/"/g, '""')}"`,
        t.priority,
        t.status,
        t.deadline,
        String(t.estimatedMinutes),
        String(t.actualMinutes),
      ]);
    }

    for (const s of workspace.focusSessions) {
      rows.push([
        "FocusSession",
        s.id,
        `"Focus Session (${s.mode})"`,
        `"${(s.subjectId ? subMap.get(s.subjectId) || "General" : "General").replace(
          /"/g,
          '""'
        )}"`,
        s.mode,
        "completed",
        s.date,
        String(s.durationMinutes),
        String(s.durationMinutes),
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timewise_productivity_${activeUser.id}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notifySaved("Exported productivity records as CSV.");
  };

  return (
    <AppShell>
      {workspace && activeUser && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Student Profile & Workspace Settings
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage your academic profile, Pomodoro timer configuration, theme preferences, and portable data exports.
            </p>
          </div>

          {savedNotice && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-3.5 text-xs font-semibold text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{savedNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Profile Form */}
            <form
              onSubmit={handleSaveProfile}
              className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <User className="h-5 w-5 text-indigo-600" />
                <h2>Student Profile</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  disabled={isDemo}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled={isDemo}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Level
                  </label>
                  <select
                    disabled={isDemo}
                    value={academicLevel}
                    onChange={(e) =>
                      setAcademicLevel(e.target.value as AcademicLevel)
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                  >
                    <option value="school">School</option>
                    <option value="undergraduate">Undergraduate</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Daily Study Goal (Mins)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={720}
                    step={15}
                    disabled={isDemo}
                    value={dailyStudyGoalMinutes}
                    onChange={(e) =>
                      setDailyStudyGoalMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save Profile
                </button>
              </div>
            </form>

            {/* Timer & Workspace Preferences */}
            <form
              onSubmit={handleSavePreferences}
              className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4"
            >
              <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Sliders className="h-5 w-5 text-violet-600" />
                <h2>Timer & Interface Preferences</h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Focus (m)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={focusDurationMinutes}
                    onChange={(e) =>
                      setFocusDurationMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Short Break
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={shortBreakMinutes}
                    onChange={(e) =>
                      setShortBreakMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Long Break
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={longBreakMinutes}
                    onChange={(e) =>
                      setLongBreakMinutes(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interval
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={sessionsBeforeLongBreak}
                    onChange={(e) =>
                      setSessionsBeforeLongBreak(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Appearance Theme
                  </label>
                  <select
                    value={theme}
                    onChange={(e) =>
                      setTheme(e.target.value as "light" | "dark")
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Slate Theme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Week Starts On
                  </label>
                  <select
                    value={weekStartsOn}
                    onChange={(e) =>
                      setWeekStartsOn(e.target.value as "monday" | "sunday")
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Notifications
                  </label>
                  <select
                    value={notificationsEnabled ? "enabled" : "disabled"}
                    onChange={(e) =>
                      setNotificationsEnabled(e.target.value === "enabled")
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    <option value="enabled">Enabled</option>
                    <option value="disabled">Muted</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Apply Preferences
                </button>
              </div>
            </form>
          </div>

          {/* Data Management & Exports */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="h-5 w-5 text-emerald-600" />
                <span>Data Portability & Workspace Management</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Export your complete workspace or reset your current active workspace without affecting any other accounts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJSON}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
              >
                <FileJson className="h-4 w-4 text-indigo-600" />
                Export Workspace as JSON
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Export Productivity Data as CSV
              </button>

              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 px-4 py-2.5 text-xs font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-colors"
              >
                {isDemo ? (
                  <>
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                    Reset Shared Demo Workspace
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 text-red-600" />
                    Reset Personal Workspace
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors ml-auto"
              >
                <LogOut className="h-4 w-4" />
                Logout Session
              </button>
            </div>
          </div>

          <ConfirmDialog
            open={confirmResetOpen}
            onClose={() => setConfirmResetOpen(false)}
            onConfirm={() => {
              if (isDemo) {
                resetDemo();
                notifySaved(
                  "Demo workspace restored to default sample dataset. Personal student accounts were untouched."
                );
              } else {
                resetCurrentStudentWorkspace();
                notifySaved(
                  "Your personal workspace has been reset. Other student profiles and the Demo workspace were untouched."
                );
              }
            }}
            title={
              isDemo
                ? "Reset Shared Demo Workspace"
                : "Reset Your Personal Student Workspace"
            }
            message={
              isDemo
                ? "This will restore all sample tasks, weekly schedule blocks, and focus sessions in the Shared Demo Workspace to their initial defaults. No personal student workspaces will be modified."
                : `This will permanently clear all tasks, scheduled study blocks, and focus session records in ${activeUser.fullName}'s personal workspace. Other registered student accounts and the Shared Demo Workspace will remain completely untouched.`
            }
            confirmLabel={isDemo ? "Reset Demo Data" : "Reset My Workspace"}
            variant="danger"
          />
        </div>
      )}
    </AppShell>
  );
}
