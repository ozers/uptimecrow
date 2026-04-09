// AI Service — Claude API integration for incident reports

import Anthropic from "@anthropic-ai/sdk";

export interface IncidentAiResult {
  title: string;
  severity: "minor" | "major" | "critical";
  updateText: string;
}

const getClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
};

export async function generateIncidentReport(context: {
  serviceName: string;
  url: string;
  error: string;
  statusCode?: number;
  responseMs?: number;
  failedChecks: number;
  detectedAt: string;
}): Promise<IncidentAiResult> {
  const client = getClient();
  if (!client) {
    return fallbackIncidentReport(context);
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a status page incident reporter. Generate a concise incident report for a service outage.

Service: ${context.serviceName}
URL: ${context.url}
Error: ${context.error}
${context.statusCode ? `HTTP Status: ${context.statusCode}` : ""}
${context.responseMs ? `Response Time: ${context.responseMs}ms` : ""}
Failed Checks: ${context.failedChecks}
Detected At: ${context.detectedAt}

Respond in JSON format only:
{
  "title": "Short incident title (max 100 chars)",
  "severity": "minor|major|critical",
  "updateText": "Public-facing status update (2-3 sentences, professional tone, no internal details)"
}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const parsed = JSON.parse(text);

    return {
      title: parsed.title || `${context.serviceName} is experiencing issues`,
      severity: ["minor", "major", "critical"].includes(parsed.severity)
        ? parsed.severity
        : fallbackSeverity(context.failedChecks),
      updateText:
        parsed.updateText ||
        `We are investigating an issue with ${context.serviceName}.`,
    };
  } catch (err) {
    console.error("[AI] Failed to generate incident report:", err);
    return fallbackIncidentReport(context);
  }
}

export async function generateResolvedUpdate(context: {
  serviceName: string;
  downtimeMinutes: number;
  incidentTitle: string;
}): Promise<string> {
  const client = getClient();
  if (!client) {
    return fallbackResolvedUpdate(context);
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are a status page incident reporter. Write a brief resolution update for a status page.

Service: ${context.serviceName}
Incident: ${context.incidentTitle}
Downtime Duration: ${context.downtimeMinutes} minutes

Write 2-3 sentences in a professional, reassuring tone. No JSON, just the update text.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    return text.trim() || fallbackResolvedUpdate(context);
  } catch (err) {
    console.error("[AI] Failed to generate resolved update:", err);
    return fallbackResolvedUpdate(context);
  }
}

function fallbackSeverity(
  failedChecks: number,
): "minor" | "major" | "critical" {
  if (failedChecks >= 5) return "critical";
  if (failedChecks >= 3) return "major";
  return "minor";
}

function fallbackIncidentReport(context: {
  serviceName: string;
  error: string;
  failedChecks: number;
}): IncidentAiResult {
  return {
    title: `${context.serviceName} is experiencing issues`,
    severity: fallbackSeverity(context.failedChecks),
    updateText: `We are investigating an issue with ${context.serviceName}. Our monitoring detected: ${context.error}. We are working to resolve this as quickly as possible.`,
  };
}

function fallbackResolvedUpdate(context: {
  serviceName: string;
  downtimeMinutes: number;
}): string {
  return `${context.serviceName} is back to normal. The issue lasted approximately ${context.downtimeMinutes} minutes. We apologize for the inconvenience.`;
}
