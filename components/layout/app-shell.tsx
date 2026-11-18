"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  Settings,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useTimewise } from "@/hooks/use-timewise";
import { ConfirmDialog } from "@/components/ui/modal";
import { formatLocalDate, isTaskOverdue } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/planner", label: "Weekly Planner", icon: Calendar },
  { href: "/focus", label: "Focus Room", icon: Clock },
  { href: "/assistant", label: "AI Study Assistant", icon: Sparkles },
  { href: "/analytics", label: "Productivity Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    hydrated,
    activeUser,
    isDemo,
    workspace,
    registeredStudents,
    switchAccount,
    enterDemoMode,
    logout,
    resetDemo,
  } = useTimewise();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [confirmResetDemoOpen, setConfirmResetDemoOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Loading TIMEWISE workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!activeUser || !workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm text-center space-y-5">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-lg">
            TW
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Select a TIMEWISE Workspace
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Sign in to your personal student account or explore the interactive shared demo workspace.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Link
              href="/login"
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Student Login / Switch Account
            </Link>
            <Link
              href="/register"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Create Student Account
            </Link>
            <button
              type="button"
              onClick={() => enterDemoMode()}
              className="w-full rounded-lg bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 px-4 py-2.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
            >
              Explore Shared Demo Workspace
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todayStr = formatLocalDate();
  const overdueTasks = workspace.tasks.filter((t) =>
    isTaskOverdue(t.deadline, t.status, todayStr)
  );
  const dueTodayTasks = workspace.tasks.filter(
    (t) => t.status !== "completed" && t.deadline === todayStr
  );
  const alertCount = overdueTasks.length + dueTodayTasks.length;

  const currentNav = NAV_ITEMS.find((item) => pathname.startsWith(item.href)) || NAV_ITEMS[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 transition-all duration-200 shrink-0 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <span className="font-bold tracking-tight text-base text-white block leading-none">
                  TIMEWISE
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  SDG 4 Student Suite
                </span>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Workspace Badge */}
        <div className="px-3 py-3 border-b border-slate-800/80">
          <div
            className={`rounded-lg px-3 py-2 text-xs ${
              isDemo
                ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                : "bg-indigo-500/10 border border-indigo-500/30 text-indigo-300"
            }`}
          >
            {sidebarCollapsed ? (
              <span className="font-bold block text-center">
                {isDemo ? "DEMO" : "STU"}
              </span>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-semibold truncate">
                  {isDemo ? "Shared Demo Mode" : "Personal Workspace"}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                  {activeUser.academicLevel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar Footer */}
        <div className="border-t border-slate-800 p-3 space-y-2">
          {isDemo && !sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setConfirmResetDemoOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Sample Demo Data
            </button>
          )}
          <div className="flex items-center justify-between gap-2 px-1">
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {activeUser.fullName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {activeUser.email}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
              title="Logout / Switch Mode"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 flex w-72 flex-col bg-slate-900 text-white shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
              <Link
                href="/"
                className="flex items-center gap-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="font-bold text-base">TIMEWISE</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-indigo-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-800 p-4 space-y-2">
              {isDemo && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setConfirmResetDemoOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Demo Data
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-red-600 hover:text-white transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out / Switch Mode
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Demo Banner */}
        {isDemo && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/80 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Shared Demo Workspace (Sample Data):</strong> All records shown here are preloaded demonstration samples and are isolated from personal student accounts.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetDemoOpen(true)}
                className="inline-flex items-center gap-1 rounded-md bg-amber-200/70 dark:bg-amber-900 px-2.5 py-1 font-semibold text-amber-950 dark:text-amber-100 hover:bg-amber-300/80 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Demo
              </button>
              <Link
                href="/register"
                className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Create Personal Account
              </Link>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 sm:px-6 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                href="/dashboard"
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium hidden sm:inline"
              >
                TIMEWISE
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentNav.label}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileMenuOpen(false);
                }}
                className="relative rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {alertCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-lg z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Academic Alerts ({alertCount})
                    </span>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-3 max-h-64 overflow-y-auto space-y-2">
                    {overdueTasks.length === 0 && dueTodayTasks.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">
                        You are all caught up! No overdue or due-today tasks.
                      </p>
                    ) : (
                      <>
                        {overdueTasks.map((t) => (
                          <Link
                            key={t.id}
                            href="/tasks"
                            onClick={() => setNotificationsOpen(false)}
                            className="block rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/40 p-2.5 hover:bg-red-100/70 transition-colors"
                          >
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                              Overdue: {t.title}
                            </p>
                            <p className="text-[11px] text-red-600 dark:text-red-400">
                              Due {t.deadline}
                            </p>
                          </Link>
                        ))}
                        {dueTodayTasks.map((t) => (
                          <Link
                            key={t.id}
                            href="/tasks"
                            onClick={() => setNotificationsOpen(false)}
                            className="block rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-2.5 hover:bg-amber-100/70 transition-colors"
                          >
                            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                              Due Today: {t.title}
                            </p>
                            <p className="text-[11px] text-amber-700 dark:text-amber-400">
                              Estimated {t.estimatedMinutes} mins
                            </p>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Account Switcher / Profile Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {activeUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block max-w-[150px]">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {activeUser.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {isDemo ? "Demo Workspace" : `${activeUser.dailyStudyGoalMinutes}m daily goal`}
                  </p>
                </div>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-lg z-50 space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {activeUser.fullName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {activeUser.email}
                    </p>
                    <span className="mt-1 inline-block rounded bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 dark:text-indigo-300">
                      {isDemo ? "Shared Demo Mode" : `Student (${activeUser.academicLevel})`}
                    </span>
                  </div>

                  {/* Quick Account Switcher */}
                  {registeredStudents.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Switch Student Account
                      </p>
                      {registeredStudents.map((stu) => {
                        const isCurrent = !isDemo && activeUser.id === stu.id;
                        return (
                          <button
                            key={stu.id}
                            type="button"
                            onClick={() => {
                              switchAccount(stu.id);
                              setProfileMenuOpen(false);
                              showToast(`Switched to ${stu.fullName}'s personal workspace`);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                              isCurrent
                                ? "bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span className="truncate">{stu.fullName}</span>
                            {isCurrent && <UserCheck className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {!isDemo ? (
                      <button
                        type="button"
                        onClick={() => {
                          enterDemoMode();
                          setProfileMenuOpen(false);
                          showToast("Switched to Shared Demo Workspace");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                        Switch to Shared Demo
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setConfirmResetDemoOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset Demo Dataset
                      </button>
                    )}

                    <Link
                      href="/login"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Account Selection Screen
                    </Link>

                    <Link
                      href="/settings"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Profile & Workspace Settings
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setProfileMenuOpen(false);
                        router.push("/login");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Toast Feedback Banner */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white px-4 py-3 text-xs font-medium shadow-lg border border-slate-700 flex items-center gap-2">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={confirmResetDemoOpen}
        onClose={() => setConfirmResetDemoOpen(false)}
        onConfirm={() => {
          resetDemo();
          showToast("Demo workspace restored to default sample dataset.");
        }}
        title="Reset Shared Demo Workspace"
        message="This will restore all sample tasks, subjects, weekly schedule blocks, and focus sessions in the Demo Workspace to their default state. Individual student accounts will NOT be affected."
        confirmLabel="Reset Demo Data"
        variant="warning"
      />
    </div>
  );
}
