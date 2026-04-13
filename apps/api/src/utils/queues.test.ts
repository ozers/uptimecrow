import { describe, it, expect } from "vitest";
import { isTerminalFailure } from "./queues.js";

describe("isTerminalFailure", () => {
  it("is terminal when attemptsMade equals configured attempts", () => {
    expect(isTerminalFailure({ attemptsMade: 3, opts: { attempts: 3 } })).toBe(true);
  });

  it("is terminal when attemptsMade exceeds configured attempts (defensive)", () => {
    expect(isTerminalFailure({ attemptsMade: 4, opts: { attempts: 3 } })).toBe(true);
  });

  it("is not terminal on an interim attempt", () => {
    expect(isTerminalFailure({ attemptsMade: 1, opts: { attempts: 3 } })).toBe(false);
    expect(isTerminalFailure({ attemptsMade: 2, opts: { attempts: 3 } })).toBe(false);
  });

  it("defaults to attempts=1 when no opts are present — a single failure is terminal", () => {
    expect(isTerminalFailure({ attemptsMade: 1 })).toBe(true);
    expect(isTerminalFailure({ attemptsMade: 0 })).toBe(false);
  });

  it("treats a missing job as terminal (nothing more we can do)", () => {
    expect(isTerminalFailure(undefined)).toBe(true);
  });
});
