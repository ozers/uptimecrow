import { describe, it, expect } from "vitest";
import { evaluateTransition } from "./state-transition.js";

describe("evaluateTransition", () => {
  describe("from UP", () => {
    it("stays UP on a successful check", () => {
      expect(evaluateTransition("up", true, 0, 2)).toBe("none");
    });

    it("stays UP on a single failure below confirmation threshold", () => {
      expect(evaluateTransition("up", false, 1, 2)).toBe("none");
    });

    it("transitions to DOWN once failure count reaches confirmation threshold", () => {
      expect(evaluateTransition("up", false, 2, 2)).toBe("up_to_down");
    });

    it("transitions to DOWN when failure count exceeds threshold", () => {
      expect(evaluateTransition("up", false, 5, 2)).toBe("up_to_down");
    });

    it("honours higher confirmation counts (no transition until reached)", () => {
      expect(evaluateTransition("up", false, 4, 5)).toBe("none");
      expect(evaluateTransition("up", false, 5, 5)).toBe("up_to_down");
    });

    it("does not transition on a passing check even with stale failure count", () => {
      expect(evaluateTransition("up", true, 10, 2)).toBe("none");
    });
  });

  describe("from UNKNOWN (initial state)", () => {
    it("is treated like UP — stays put on success", () => {
      expect(evaluateTransition("unknown", true, 0, 2)).toBe("none");
    });

    it("transitions to DOWN once failures confirm", () => {
      expect(evaluateTransition("unknown", false, 2, 2)).toBe("up_to_down");
    });
  });

  describe("from DOWN", () => {
    it("transitions to UP on a single successful check (fast recovery)", () => {
      expect(evaluateTransition("down", true, 0, 2)).toBe("down_to_up");
    });

    it("stays DOWN on continued failures", () => {
      expect(evaluateTransition("down", false, 3, 2)).toBe("none");
    });

    it("ignores failure count when check passes — 1 success is enough", () => {
      expect(evaluateTransition("down", true, 99, 2)).toBe("down_to_up");
    });
  });

  describe("false-alarm protection invariant", () => {
    it("a single blip never flips UP → DOWN when confirmationCount >= 2", () => {
      // Simulate the first failure: count becomes 1 after increment, threshold is 2.
      expect(evaluateTransition("up", false, 1, 2)).toBe("none");
    });

    it("with confirmationCount = 1 a single failure is enough (opt-in aggressive mode)", () => {
      expect(evaluateTransition("up", false, 1, 1)).toBe("up_to_down");
    });
  });
});
