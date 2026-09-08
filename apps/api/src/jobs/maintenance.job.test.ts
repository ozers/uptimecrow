import { describe, it, expect } from "vitest";
import { nextOccurrence, remainingRecurrence } from "./maintenance.job.js";
import type { Recurrence } from "@uptimecrow/shared";

// The scheduler writes the window the user approved in the form preview, so
// this has to agree with nextOccurrences() in apps/web/src/lib/recurrence.ts.

const weekly: Recurrence = { freq: "weekly", byWeekday: 2 };
const monthly: Recurrence = { freq: "monthly", byMonthDay: 1 };

describe("nextOccurrence", () => {
  it("moves a weekly window forward exactly seven days, keeping the time", () => {
    const next = nextOccurrence(weekly, new Date("2026-09-08T02:00:00.000Z"));
    expect(next?.toISOString()).toBe("2026-09-15T02:00:00.000Z");
  });

  it("moves a monthly window to the configured day of the next month", () => {
    const next = nextOccurrence(monthly, new Date("2026-09-01T02:00:00.000Z"));
    expect(next?.getUTCMonth()).toBe(9); // October
    expect(next?.getUTCDate()).toBe(1);
  });

  it("stops once the end date has passed", () => {
    const bounded: Recurrence = { ...weekly, until: "2026-09-10T00:00:00.000Z" };
    expect(nextOccurrence(bounded, new Date("2026-09-08T02:00:00.000Z"))).toBeNull();
  });

  it("still returns an occurrence that lands exactly before the end date", () => {
    const bounded: Recurrence = { ...weekly, until: "2026-09-20T00:00:00.000Z" };
    expect(nextOccurrence(bounded, new Date("2026-09-08T02:00:00.000Z"))).not.toBeNull();
  });
});

describe("remainingRecurrence", () => {
  it("carries an unbounded rule through unchanged", () => {
    expect(remainingRecurrence(weekly)).toEqual(weekly);
  });

  it("spends the count one window at a time", () => {
    // Each materialised row carries what is left, so a scheduler that dies
    // mid-run cannot double-decrement on restart.
    expect(remainingRecurrence({ ...weekly, count: 4 })).toEqual({ ...weekly, count: 3 });
  });

  it("drops the rule on the final repeat so the chain ends", () => {
    expect(remainingRecurrence({ ...weekly, count: 2 })).toBeNull();
    expect(remainingRecurrence({ ...weekly, count: 1 })).toBeNull();
  });
});
