import { NextRequest, NextResponse } from "next/server";
import {
  StudyAssistantInput,
  generateRuleBasedStudyPlan,
} from "@/lib/ai/rule-engine";
import { AIResponsePayload } from "@/types";
import { generateId } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as StudyAssistantInput;
    if (!body || !Array.isArray(body.tasks) || !Array.isArray(body.subjects)) {
      return NextResponse.json(
        { error: "Invalid request payload: tasks and subjects are required." },
        { status: 400 }
      );
    }

    const aiProvider = (process.env.AI_PROVIDER || "").trim().toLowerCase();
    const aiApiKey = (process.env.AI_API_KEY || "").trim();
    const aiModel = (process.env.AI_MODEL || "").trim();

    // Baseline rule-based calculation is always prepared so we can validate or fallback safely
    const baselinePlan = generateRuleBasedStudyPlan(body);

    if (!aiApiKey) {
      return NextResponse.json(baselinePlan, { status: 200 });
    }

    const promptText = `You are TIMEWISE AI Study Assistant, an academic self-regulated learning advisor.
Given the following student workload JSON:
${JSON.stringify({
  dailyStudyGoalMinutes: body.dailyStudyGoalMinutes,
  availableHoursPerDay: body.availableHoursPerDay,
  preferredStartHour: body.preferredStartHour,
  assignmentToBreakDown: body.assignmentToBreakDown,
  subjects: body.subjects.map((s) => ({ id: s.id, name: s.name })),
  tasks: body.tasks
    .filter((t) => t.status !== "completed")
    .map((t) => ({
      id: t.id,
      title: t.title,
      subjectId: t.subjectId,
      priority: t.priority,
      deadline: t.deadline,
      estimatedMinutes: t.estimatedMinutes,
      actualMinutes: t.actualMinutes,
    })),
  existingPlannerEvents: body.plannerEvents.map((e) => ({
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
  })),
})}

Return ONLY valid JSON matching this schema:
{
  "summaryExplanation": "string explaining schedule strategy",
  "prioritizedTasks": [{ "taskId": "string", "title": "string", "rank": 1, "urgencyScore": 90, "reason": "string" }],
  "recommendedSchedule": [{ "title": "string", "subjectId": "string", "taskId": "string", "date": "YYYY-MM-DD", "startTime": "HH:mm", "endTime": "HH:mm", "plannedMinutes": 60, "reason": "string" }],
  "breakdownSubtasks": [{ "title": "string", "estimatedMinutes": 30, "priority": "high", "rationale": "string" }],
  "conflictWarnings": [{ "severity": "high", "message": "string", "recommendation": "string" }]
}`;

    try {
      if (aiProvider === "openai") {
        const model = aiModel || "gpt-4o-mini";
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiApiKey}`,
          },
          body: JSON.stringify({
            model,
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  "You are an academic planning assistant. Always respond with valid JSON matching the requested schema.",
              },
              { role: "user", content: promptText },
            ],
            temperature: 0.3,
          }),
        });

        if (!res.ok) {
          throw new Error(`OpenAI API returned status ${res.status}`);
        }
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);

        const payload: AIResponsePayload = {
          source: "ai",
          providerName: "OpenAI",
          modelName: model,
          prioritizedTasks: Array.isArray(parsed.prioritizedTasks)
            ? parsed.prioritizedTasks
            : baselinePlan.prioritizedTasks,
          recommendedSchedule: Array.isArray(parsed.recommendedSchedule)
            ? parsed.recommendedSchedule.map((item: Record<string, unknown>) => ({
                ...item,
                id: generateId("aisched"),
              }))
            : baselinePlan.recommendedSchedule,
          breakdownSubtasks: Array.isArray(parsed.breakdownSubtasks)
            ? parsed.breakdownSubtasks
            : baselinePlan.breakdownSubtasks,
          conflictWarnings: Array.isArray(parsed.conflictWarnings)
            ? parsed.conflictWarnings
            : baselinePlan.conflictWarnings,
          summaryExplanation:
            typeof parsed.summaryExplanation === "string"
              ? parsed.summaryExplanation
              : baselinePlan.summaryExplanation,
        };
        return NextResponse.json(payload, { status: 200 });
      } else {
        // Default to Google Gemini API
        const model = aiModel || "gemini-2.5-flash";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          model
        )}:generateContent?key=${encodeURIComponent(aiApiKey)}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          }),
        });

        if (!res.ok) {
          throw new Error(`Gemini API returned status ${res.status}`);
        }
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        const parsed = JSON.parse(rawText);

        const payload: AIResponsePayload = {
          source: "ai",
          providerName: "Google Gemini",
          modelName: model,
          prioritizedTasks: Array.isArray(parsed.prioritizedTasks)
            ? parsed.prioritizedTasks
            : baselinePlan.prioritizedTasks,
          recommendedSchedule: Array.isArray(parsed.recommendedSchedule)
            ? parsed.recommendedSchedule.map((item: Record<string, unknown>) => ({
                ...item,
                id: generateId("aisched"),
              }))
            : baselinePlan.recommendedSchedule,
          breakdownSubtasks: Array.isArray(parsed.breakdownSubtasks)
            ? parsed.breakdownSubtasks
            : baselinePlan.breakdownSubtasks,
          conflictWarnings: Array.isArray(parsed.conflictWarnings)
            ? parsed.conflictWarnings
            : baselinePlan.conflictWarnings,
          summaryExplanation:
            typeof parsed.summaryExplanation === "string"
              ? parsed.summaryExplanation
              : baselinePlan.summaryExplanation,
        };
        return NextResponse.json(payload, { status: 200 });
      }
    } catch (providerErr: unknown) {
      const errMsg =
        providerErr instanceof Error ? providerErr.message : "External AI request failed";
      const fallbackWithWarning = generateRuleBasedStudyPlan(
        body,
        `External AI service (${aiProvider || "gemini"}) encountered an error (${errMsg}). Automatically switched to the verified Rule-Based Study Engine.`
      );
      return NextResponse.json(fallbackWithWarning, { status: 200 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
