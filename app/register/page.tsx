"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  ShieldAlert,
} from "lucide-react";
import { useTimewise } from "@/hooks/use-timewise";
import { AcademicLevel } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { registerStudent, enterDemoMode } = useTimewise();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>("undergraduate");
  const [dailyStudyGoalMinutes, setDailyStudyGoalMinutes] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters).");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (dailyStudyGoalMinutes < 15 || dailyStudyGoalMinutes > 720) {
      setError("Daily study goal must be between 15 and 720 minutes.");
      return;
    }

    setSubmitting(true);
    try {
      await registerStudent({
        fullName,
        email,
        passwordPlain: password,
        academicLevel,
        dailyStudyGoalMinutes,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">
            TIMEWISE
          </span>
        </Link>
        <Link
          href="/login"
          className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600"
        >
          Already have an account? Sign In →
        </Link>
      </div>

      <div className="max-w-4xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Info Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              Individual Student Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Create Your Student Account
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your personal workspace includes isolated tasks, subjects, weekly planner events, Pomodoro focus records, and estimation analytics.
            </p>
          </div>

          <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
            {[
              "Unique internal Student ID & isolated workspace storage",
              "Pre-configured core academic subjects (customizable)",
              "Personalized daily study target for AI & rule-based scheduling",
              "Instant switching between personal accounts and Demo mode",
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Prototype Persistence Limitation</span>
            </div>
            <p className="leading-relaxed">
              Account data is stored locally in your browser&apos;s{" "}
              <code className="font-mono">localStorage</code> with SHA-256 password hashing (never plaintext). Data does not sync across separate browsers unless exported via Settings.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              enterDemoMode();
              router.push("/dashboard");
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/40 px-4 py-3 text-xs font-semibold text-violet-800 dark:text-violet-200 hover:bg-violet-100 transition-colors"
          >
            <FlaskConical className="h-4 w-4 text-violet-600" />
            Prefer to inspect sample data first? Explore Demo Workspace
          </button>
        </div>

        {/* Registration Form */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Student Registration Details
          </h2>

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Full Name *
              </label>
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g., Priya Sharma"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Email Address *
              </label>
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.sharma@university.edu"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Password * (min 6 characters, stored as SHA-256 hash)
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="reg-level"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Academic Level *
                </label>
                <select
                  id="reg-level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
                >
                  <option value="school">School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="postgraduate">Postgraduate</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="reg-goal"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Daily Study Goal (Minutes) *
                </label>
                <input
                  id="reg-goal"
                  type="number"
                  min={15}
                  max={720}
                  step={15}
                  required
                  value={dailyStudyGoalMinutes}
                  onChange={(e) => setDailyStudyGoalMinutes(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Recommended: 120–180 minutes/day ({Math.round((dailyStudyGoalMinutes / 60) * 10) / 10} hrs)
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors mt-2"
            >
              {submitting ? "Creating Student Workspace..." : "Create Account & Open Workspace"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 pt-2">
            Already registered?{" "}
            <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center text-xs text-slate-400 py-2">
        TIMEWISE — Student Productivity & Time Management Platform
      </div>
    </div>
  );
}
