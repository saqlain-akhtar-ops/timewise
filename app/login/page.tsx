"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  FlaskConical,
  KeyRound,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { useTimewise } from "@/hooks/use-timewise";

export default function LoginPage() {
  const router = useRouter();
  const {
    loginStudent,
    enterDemoMode,
    switchAccount,
    registeredStudents,
    hydrated,
  } = useTimewise();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }
    setSubmitting(true);
    try {
      await loginStudent(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to sign in with those credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = () => {
    enterDemoMode();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">
            TIMEWISE
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          ← Back to Home
        </Link>
      </div>

      <div className="max-w-5xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Account Selection Modes */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Account & Workspace Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Choose How to Use TIMEWISE
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              TIMEWISE supports isolated personal student workspaces alongside a preloaded shared demonstration workspace.
            </p>
          </div>

          {/* Option Cards */}
          <div className="space-y-3">
            <Link
              href="/register"
              className="flex items-start gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-400 transition-colors shadow-2xs"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>1. Create Student Account</span>
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register a private student profile with your academic level and daily study goal.
                </p>
              </div>
            </Link>

            <div className="flex items-start gap-3.5 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Student Login (Active Panel)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Sign in with your registered email or switch between existing local student accounts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemo}
              className="w-full text-left flex items-start gap-3.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/40 p-4 hover:bg-violet-100/70 transition-colors"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-violet-950 dark:text-violet-100 flex items-center justify-between">
                  <span>3. Explore Demo Workspace</span>
                  <ArrowRight className="h-4 w-4 text-violet-600" />
                </p>
                <p className="text-xs text-violet-800/80 dark:text-violet-300 mt-0.5">
                  Open immediately without registration. Preloaded with realistic subjects, tasks, planner blocks, focus sessions, and analytics.
                </p>
              </div>
            </button>
          </div>

          {/* Prototype Security Notice */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Prototype Identity System Notice</span>
            </div>
            <p className="leading-relaxed">
              This release stores accounts in browser{" "}
              <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">
                localStorage
              </code>
              . Passwords are hashed client-side using SHA-256 digests (never stored in plaintext), and each student ID is strictly isolated, but this is a local prototype identity system rather than production cloud authentication.
            </p>
          </div>
        </div>

        {/* Right Column: Login Form + Quick Account Switcher */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Student Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your registered email and password to open your personal workspace.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Academic Email Address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Signing in..." : "Sign In to Personal Workspace"}
            </button>
          </form>

          {/* Existing Registered Profiles on this Browser */}
          {hydrated && registeredStudents.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <Users className="h-4 w-4 text-indigo-600" />
                <span>Quick Switch — Registered Student Profiles on This Device</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {registeredStudents.map((stu) => (
                  <button
                    key={stu.id}
                    type="button"
                    onClick={() => {
                      switchAccount(stu.id);
                      router.push("/dashboard");
                    }}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-left hover:border-indigo-500 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {stu.fullName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{stu.email}</p>
                      <span className="mt-1 inline-block rounded bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-indigo-700 dark:text-indigo-300">
                        {stu.academicLevel} • {stu.dailyStudyGoalMinutes}m/day
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-indigo-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>New to TIMEWISE?</span>
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="font-semibold text-indigo-600 hover:underline"
              >
                Create Student Account →
              </Link>
              <button
                type="button"
                onClick={handleDemo}
                className="font-semibold text-violet-600 hover:underline"
              >
                or Explore Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-2">
        TIMEWISE — Student Productivity & Time Management Platform (SDG 4)
      </div>
    </div>
  );
}
