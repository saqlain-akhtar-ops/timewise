"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Clock,
  FlaskConical,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { useTimewise } from "@/hooks/use-timewise";

export default function LandingPage() {
  const router = useRouter();
  const { enterDemoMode, activeUser } = useTimewise();

  const handleExploreDemo = () => {
    enterDemoMode();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                TIMEWISE
              </span>
              <span className="hidden sm:inline-block ml-2 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                SDG 4 Action Lab
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#benefits" className="hover:text-indigo-600 transition-colors">
              Educational Impact
            </a>
            <a href="#privacy" className="hover:text-indigo-600 transition-colors">
              Privacy & Architecture
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {activeUser ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Student Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-24 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <GraduationCap className="h-4 w-4" />
                <span>UN SDG 4 Quality Education • Self-Regulated Learning Platform</span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  TIMEWISE STUDENT PRODUCTIVITY PLATFORM
                </p>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                  Plan Smarter.{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Focus Better.
                  </span>{" "}
                  Achieve More.
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                Take control of your academic schedule. Organize your tasks, focus on what matters and understand how you spend your time.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleExploreDemo}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <FlaskConical className="h-4 w-4 text-violet-600" />
                  Explore Demo
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                    Isolated Workspaces
                  </span>
                  Personal & Shared Demo
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                    Planned vs Actual
                  </span>
                  Estimation accuracy tracking
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-sm">
                    AI + Rule Fallback
                  </span>
                  Conflict-free study blocks
                </div>
              </div>
            </div>

            {/* Interactive Dashboard Preview Card */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                {/* Browser Frame Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-900 px-4 py-3 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 font-semibold text-white">
                      TIMEWISE — Academic Workspace Preview
                    </span>
                  </div>
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300 font-medium">
                    Live Interactive Preview
                  </span>
                </div>

                {/* Mock Dashboard Content */}
                <div className="p-5 space-y-4 bg-[#F8FAFC] dark:bg-slate-950">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-500">
                        Good morning, Alex Rivera
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Weekly Academic Overview
                      </h3>
                    </div>
                    <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      88.9% Planning Accuracy
                    </span>
                  </div>

                  {/* Mini Summary Cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Today&apos;s Priority Tasks
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        4 Active
                      </p>
                      <p className="text-[10px] text-indigo-600 mt-0.5">
                        2 High Priority due soon
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Recorded Focus Time
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        4h 35m
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">
                        9 Pomodoro sessions logged
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                      <p className="text-[11px] text-slate-500 font-medium">
                        Scheduled Blocks
                      </p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        9h 30m
                      </p>
                      <p className="text-[10px] text-violet-600 mt-0.5">
                        Zero calendar conflicts
                      </p>
                    </div>
                  </div>

                  {/* Sample Tasks List */}
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <span>Upcoming Academic Deliverables</span>
                      <span className="text-indigo-600">Est. vs Actual</span>
                    </div>
                    {[
                      {
                        title: "Complete Mathematics assignment",
                        sub: "Mathematics",
                        color: "bg-indigo-600",
                        est: "90m est",
                        act: "50m focused",
                        badge: "High",
                      },
                      {
                        title: "Prepare programming practical",
                        sub: "Computer Science",
                        color: "bg-violet-600",
                        est: "120m est",
                        act: "75m focused",
                        badge: "High",
                      },
                      {
                        title: "Prepare examination notes",
                        sub: "English",
                        color: "bg-emerald-600",
                        est: "60m est",
                        act: "55m completed",
                        badge: "Completed",
                      },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`h-2 w-2 rounded-full ${row.color}`} />
                          <div className="truncate">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                              {row.title}
                            </p>
                            <p className="text-[10px] text-slate-500">{row.sub}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                            {row.est} / {row.act}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            {row.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 lg:py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              CORE CAPABILITIES
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Everything Students Need for Self-Regulated Learning
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Designed for school, undergraduate, and postgraduate learners to bridge the gap between academic intentions and focused execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CheckSquare,
                title: "Smart Task Management",
                desc: "Organize assignments by subject, priority, deadline, and estimated duration. Filter overdue deliverables and track real-time completion.",
              },
              {
                icon: Calendar,
                title: "Weekly Study Planner",
                desc: "Interactive Monday–Sunday hourly calendar with daily/weekly views, overlap detection warnings, and planned vs. actual duration comparisons.",
              },
              {
                icon: Clock,
                title: "Focus Timer (Pomodoro)",
                desc: "Timestamp-accurate circular countdown timer immune to background tab drift. Automatically logs completed sessions and updates task focus time.",
              },
              {
                icon: Sparkles,
                title: "AI Study Assistant",
                desc: "Generates conflict-free study schedules, ranks urgent assignments, and breaks down complex coursework—with a reliable rule-based fallback engine.",
              },
              {
                icon: BarChart3,
                title: "Productivity Analytics",
                desc: "Visualize task completion rates, daily focus trends, subject time distribution, and task estimation accuracy across custom date ranges.",
              },
              {
                icon: Layers,
                title: "Isolated Multi-Account & Demo Mode",
                desc: "Switch seamlessly between personal student workspaces or test-drive the preloaded Shared Demo Workspace with one-click reset.",
              },
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-[#F8FAFC] dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              HOW IT WORKS
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Three Structured Steps to Academic Mastery
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Plan your academic responsibilities",
                desc: "Capture upcoming assignments, set realistic duration estimates, and allocate conflict-free study blocks across your weekly calendar.",
              },
              {
                step: "02",
                title: "Focus on important tasks",
                desc: "Launch the Focus Room timer linked directly to a task. Work in structured intervals without distractions while TIMEWISE records actual time spent.",
              },
              {
                step: "03",
                title: "Track progress and improve",
                desc: "Compare estimated vs. actual durations, inspect your Planning Accuracy score, and refine future schedules using historical performance.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-3"
              >
                <span className="inline-block rounded-lg bg-indigo-50 dark:bg-indigo-950 px-3 py-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                  STEP {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & SDG 4 Section */}
      <section id="benefits" className="py-16 lg:py-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Target className="h-4 w-4" />
                <span>Aligned with UN SDG 4 — Quality Education (Target 4.4)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                How Structured Planning & Productivity Tracking Support Student Learning
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                Educational research shows that self-regulated learning—setting clear goals, monitoring time investment, and reflecting on estimation errors—significantly reduces academic procrastination and deadline anxiety.
              </p>
              <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  "Eliminates unstructured study sessions by pairing every calendar block with a concrete deliverable.",
                  "Calibrates planning optimism by measuring Estimated Duration against Actual Recorded Focus Time.",
                  "Protects cognitive energy through customizable Pomodoro focus and rest intervals.",
                  "Empowers students with transparent, user-approved scheduling assistance.",
                ].map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="privacy"
              className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-slate-950 p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-base">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                <span>Transparent Prototype Architecture & Privacy</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                TIMEWISE Release 1.0 uses a centralized, versioned browser{" "}
                <code className="rounded bg-slate-200/70 dark:bg-slate-800 px-1 py-0.5">
                  localStorage
                </code>{" "}
                persistence layer designed for fast local demonstration and student pilots:
              </p>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                <li>
                  <strong>Strict Workspace Isolation:</strong> Each registered student ID maintains separate tasks, subjects, planner events, focus sessions, and analytics.
                </li>
                <li>
                  <strong>Prototype Identity Notice:</strong> Passwords are hashed client-side using SHA-256 digests (never stored in plaintext), but browser storage is a prototype identity mechanism—not production cloud authentication.
                </li>
                <li>
                  <strong>Full Data Portability:</strong> Export your complete workspace as JSON or productivity records as CSV at any time.
                </li>
              </ul>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Open Account Selection
                </Link>
                <button
                  type="button"
                  onClick={handleExploreDemo}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Launch Shared Demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <BookOpen className="h-5 w-5 text-indigo-400" />
                <span>TIMEWISE</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Plan Smarter. Focus Better. Achieve More. Student Productivity & Time Management Platform.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-200">
                About
              </p>
              <p>University SDG Action Lab Project</p>
              <p>Aligned with UN SDG 4 (Target 4.4)</p>
              <p>Self-Regulated Learning Initiative</p>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-200">
                Features
              </p>
              <ul className="space-y-1.5">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Smart Task Management
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Weekly Study Planner
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Pomodoro Focus Room
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    AI Study Assistant & Analytics
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold uppercase tracking-wider text-slate-200">
                Privacy & Contact
              </p>
              <p>
                Local-first prototype persistence (browser localStorage). Zero third-party tracking.
              </p>
              <p className="text-slate-300 font-medium pt-1">
                Contact: timewise-sdg4-lab@university.edu
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <p>© {new Date().getFullYear()} TIMEWISE Project. Built for Student Success.</p>
            <div className="flex items-center gap-4">
              <Link href="/login" className="hover:text-slate-300">
                Student Login
              </Link>
              <Link href="/register" className="hover:text-slate-300">
                Create Account
              </Link>
              <button
                type="button"
                onClick={handleExploreDemo}
                className="hover:text-slate-300"
              >
                Explore Demo
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
