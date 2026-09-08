// Maintenance window lifecycle — closing finished windows and materialising the
// next one for recurring schedules.
//
// Two things were missing before this job existed. Nothing ever moved a window
// out of `scheduled`, so the status column was decorative: the check job only
// ever asked "is now between start and end", and a window from last March still
// read as "Scheduled" on the dashboard forever. And a weekly maintenance slot
// had to be created by hand every week.
//
// Recurrence is materialised, not expanded at query time: when a window closes
// we insert the next concrete row. Everything downstream — the active-window
// lookup in check.job.ts, the status page renderer, subscriber notifications —
// keeps working on real rows and needs no knowledge of recurrence at all.

import { and, eq, lt, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import { maintenanceWindows, maintenanceWindowMonitors } from "../db/schema.js";
import type { Recurrence } from "@uptimecrow/shared";
import { logger } from "../utils/logger.js";

// Mirrors nextOccurrences() in apps/web/src/lib/recurrence.ts: the preview the
// user approves in the form and the row the scheduler writes must agree.
export function nextOccurrence(
  recurrence: Recurrence,
  start: Date,
): Date | null {
  const next = new Date(start);

  if (recurrence.freq === "weekly") {
    next.setDate(next.getDate() + 7);
  } else {
    next.setMonth(next.getMonth() + 1);
    if (recurrence.byMonthDay) next.setDate(recurrence.byMonthDay);
  }

  if (recurrence.until && next > new Date(recurrence.until)) return null;
  return next;
}

// The count is spent one window at a time: each materialised row carries the
// remaining count, so an interrupted scheduler cannot double-decrement.
export function remainingRecurrence(recurrence: Recurrence): Recurrence | null {
  if (recurrence.count == null) return recurrence;
  const left = recurrence.count - 1;
  if (left <= 1) return null; // this was the last repeat
  return { ...recurrence, count: left };
}

export interface MaintenanceCloseResult {
  closed: number;
  materialised: number;
}

export async function closeDueMaintenanceWindows(
  now: Date = new Date(),
): Promise<MaintenanceCloseResult> {
  const due = await db
    .select()
    .from(maintenanceWindows)
    .where(
      and(
        inArray(maintenanceWindows.status, ["scheduled", "in_progress"]),
        lt(maintenanceWindows.scheduledEnd, now),
      ),
    );

  if (due.length === 0) return { closed: 0, materialised: 0 };

  let materialised = 0;

  for (const window of due) {
    await db
      .update(maintenanceWindows)
      .set({ status: "completed" })
      .where(eq(maintenanceWindows.id, window.id));

    const recurrence = window.recurrence;
    if (!recurrence) continue;

    const start = nextOccurrence(recurrence, window.scheduledStart);
    if (!start) continue;

    // Keep the window the same length rather than recomputing an end time —
    // "02:00 to 04:00" stays two hours long across DST boundaries.
    const durationMs = window.scheduledEnd.getTime() - window.scheduledStart.getTime();
    const end = new Date(start.getTime() + durationMs);

    const [created] = await db
      .insert(maintenanceWindows)
      .values({
        orgId: window.orgId,
        statusPageId: window.statusPageId,
        title: window.title,
        body: window.body,
        scheduledStart: start,
        scheduledEnd: end,
        recurrence: remainingRecurrence(recurrence),
      })
      .returning({ id: maintenanceWindows.id });

    // Carry the monitor links over; a recurring window that suppressed alerts
    // for three services must keep doing so next week.
    const links = await db
      .select({ monitorId: maintenanceWindowMonitors.monitorId })
      .from(maintenanceWindowMonitors)
      .where(eq(maintenanceWindowMonitors.maintenanceWindowId, window.id));

    if (links.length > 0) {
      await db.insert(maintenanceWindowMonitors).values(
        links.map((l) => ({ maintenanceWindowId: created.id, monitorId: l.monitorId })),
      );
    }

    materialised += 1;
  }

  return { closed: due.length, materialised };
}

export async function processMaintenanceJob(): Promise<void> {
  const { closed, materialised } = await closeDueMaintenanceWindows();
  if (closed === 0) return;
  logger.info(
    `[Maintenance] Closed ${closed} finished window(s), materialised ${materialised} recurring follow-up(s)`,
  );
}
