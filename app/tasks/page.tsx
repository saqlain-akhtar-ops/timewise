"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Filter,
  FolderPlus,
  Plus,
  Search,
  Timer,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useTimewise } from "@/hooks/use-timewise";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { formatLocalDate, isTaskOverdue } from "@/lib/utils";

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  high: 1,
  medium: 2,
  low: 3,
};

export default function TasksPage() {
  const {
    workspace,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    addSubject,
  } = useTimewise();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"deadline" | "priority" | "created">(
    "deadline"
  );

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Subject management modal
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubColor, setNewSubColor] = useState("#4F46E5");

  const todayStr = formatLocalDate();

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; code?: string }>();
    workspace?.subjects.forEach((s) =>
      map.set(s.id, { name: s.name, color: s.color, code: s.code })
    );
    return map;
  }, [workspace?.subjects]);

  const filteredTasks = useMemo(() => {
    if (!workspace) return [];
    const q = searchQuery.trim().toLowerCase();

    const list = workspace.tasks.filter((t) => {
      if (q) {
        const subName = subjectMap.get(t.subjectId)?.name.toLowerCase() || "";
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchNotes = (t.notes || "").toLowerCase().includes(q);
        const matchSub = subName.includes(q);
        if (!matchTitle && !matchDesc && !matchNotes && !matchSub) return false;
      }
      if (filterSubject !== "all" && t.subjectId !== filterSubject) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "deadline") {
        return a.deadline.localeCompare(b.deadline);
      }
      if (sortBy === "priority") {
        const diff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        return diff !== 0 ? diff : a.deadline.localeCompare(b.deadline);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [
    workspace,
    searchQuery,
    filterSubject,
    filterPriority,
    filterStatus,
    sortBy,
    subjectMap,
  ]);

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    addSubject(newSubName, newSubColor, newSubCode);
    setNewSubName("");
    setNewSubCode("");
    setSubjectModalOpen(false);
  };

  return (
    <AppShell>
      {workspace && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Academic Task Management
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create, prioritize, track estimated vs. actual time, and organize coursework by subject.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubjectModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <FolderPlus className="h-4 w-4 text-indigo-600" />
                Add Subject
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-xs"
              >
                <Plus className="h-4 w-4" />
                New Task
              </button>
            </div>
          </div>

          {/* Search & Filters Bar */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 relative">
                <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title, subject, or notes..."
                  aria-label="Search tasks"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-indigo-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  aria-label="Filter by subject"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Subjects</option>
                  {workspace.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  aria-label="Filter by priority"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="all">All Statuses</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "deadline" | "priority" | "created")
                  }
                  aria-label="Sort tasks by"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs sm:text-sm text-slate-700 dark:text-slate-200"
                >
                  <option value="deadline">Sort: Deadline</option>
                  <option value="priority">Sort: Priority</option>
                  <option value="created">Sort: Newest</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-indigo-600" />
                <span>
                  Showing <strong>{filteredTasks.length}</strong> of{" "}
                  <strong>{workspace.tasks.length}</strong> tasks
                </span>
              </div>
              {(searchQuery ||
                filterSubject !== "all" ||
                filterPriority !== "all" ||
                filterStatus !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterSubject("all");
                    setFilterPriority("all");
                    setFilterStatus("all");
                  }}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          </div>

          {/* Tasks Grid */}
          {filteredTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                No matching tasks found
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Try clearing your active search filters or create a new academic task to start tracking your progress.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTask(null);
                  setTaskModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                Create Academic Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
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
                    className={`rounded-2xl border p-5 shadow-2xs transition-all flex flex-col justify-between gap-4 ${
                      completed
                        ? "border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50"
                        : overdue
                        ? "border-red-300 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {sub && (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold text-white"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                          {task.isSample && (
                            <span className="rounded bg-amber-100 dark:bg-amber-950 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              SAMPLE
                            </span>
                          )}
                          {overdue && (
                            <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                              <AlertTriangle className="h-3 w-3" />
                              OVERDUE
                            </span>
                          )}
                        </div>

                        {/* Inline Priority Selector */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={task.priority}
                            onChange={(e) =>
                              updateTask(task.id, {
                                priority: e.target.value as TaskPriority,
                              })
                            }
                            aria-label={`Change priority for ${task.title}`}
                            className={`rounded-lg border px-2 py-1 text-xs font-semibold capitalize cursor-pointer ${
                              task.priority === "high"
                                ? "border-red-200 bg-red-50 text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300"
                                : task.priority === "medium"
                                ? "border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300"
                                : "border-slate-200 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                          </select>

                          <select
                            value={task.status}
                            onChange={(e) =>
                              updateTask(task.id, {
                                status: e.target.value as TaskStatus,
                              })
                            }
                            aria-label={`Change status for ${task.title}`}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            <option value="not-started">Not Started</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={completed}
                          onChange={() => toggleTaskComplete(task.id)}
                          aria-label={`Mark ${task.title} complete`}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`text-base font-bold ${
                              completed
                                ? "line-through text-slate-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {task.title}
                          </h3>
                          {task.description && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {task.description}
                            </p>
                          )}
                          {task.notes && (
                            <p className="mt-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/70 px-2.5 py-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                              <strong>Note:</strong> {task.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metrics & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-400">
                        <span className="font-medium">
                          Deadline:{" "}
                          <strong
                            className={
                              overdue
                                ? "text-red-600 font-bold"
                                : "text-slate-900 dark:text-slate-200"
                            }
                          >
                            {task.deadline}
                          </strong>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-indigo-600" />
                          Est: <strong>{task.estimatedMinutes}m</strong> / Actual:{" "}
                          <strong className="text-violet-600 dark:text-violet-400">
                            {task.actualMinutes}m
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/focus?taskId=${encodeURIComponent(task.id)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 px-2.5 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition-colors"
                          title="Start Pomodoro Focus Session for this task"
                        >
                          <Timer className="h-3.5 w-3.5" />
                          Focus
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTask(task);
                            setTaskModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 transition-colors"
                          aria-label={`Edit ${task.title}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTask(task)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-colors"
                          aria-label={`Delete ${task.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Create / Edit Task Modal */}
          <TaskFormModal
            open={taskModalOpen}
            onClose={() => {
              setTaskModalOpen(false);
              setEditingTask(null);
            }}
            subjects={workspace.subjects}
            initialTask={editingTask}
            onSave={(data) => {
              if (editingTask) {
                updateTask(editingTask.id, data);
              } else {
                addTask(data);
              }
            }}
          />

          {/* Delete Confirmation Dialog */}
          <ConfirmDialog
            open={Boolean(deletingTask)}
            onClose={() => setDeletingTask(null)}
            onConfirm={() => {
              if (deletingTask) {
                deleteTask(deletingTask.id);
              }
            }}
            title="Delete Academic Task"
            message={`Are you sure you want to permanently delete "${deletingTask?.title}"? Any scheduled planner events linked to this task will be unlinked.`}
            confirmLabel="Delete Task"
            variant="danger"
          />

          {/* Add Subject Modal */}
          <Modal
            open={subjectModalOpen}
            onClose={() => setSubjectModalOpen(false)}
            title="Manage Academic Subjects"
            description="Add a new course or subject to categorize your tasks and study sessions."
            maxWidthClass="max-w-md"
          >
            <form onSubmit={handleCreateSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g., Data Structures & Algorithms"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newSubCode}
                    onChange={(e) => setNewSubCode(e.target.value)}
                    placeholder="e.g., CS204"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Color
                  </label>
                  <input
                    type="color"
                    value={newSubColor}
                    onChange={(e) => setNewSubColor(e.target.value)}
                    className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 mb-2">
                  Current Subjects ({workspace.subjects.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {workspace.subjects.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-white"
                      style={{ backgroundColor: s.color }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setSubjectModalOpen(false)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </AppShell>
  );
}
