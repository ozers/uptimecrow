import { describe, it, expect } from "vitest";
import { orgSlugFromEmail } from "./auth.js";

// The slug is part of a permanent organization identifier, so a regression here
// is not cosmetic — it is baked into every org created while it is broken.
describe("orgSlugFromEmail", () => {
  it("lowercases before stripping, instead of eating capitals", () => {
    // The character class has no A-Z: without the lowercase pass this returned
    // "----" and every capitalised address produced the same slug.
    expect(orgSlugFromEmail("Ozer@example.com")).toBe("ozer");
    expect(orgSlugFromEmail("John.Doe@example.com")).toBe("john-doe");
  });

  it("keeps letters, digits and dashes as-is", () => {
    expect(orgSlugFromEmail("team-42@example.com")).toBe("team-42");
  });

  it("replaces everything else with a dash", () => {
    expect(orgSlugFromEmail("a+b_c@example.com")).toBe("a-b-c");
  });

  it("uses only the local part", () => {
    expect(orgSlugFromEmail("hi@sub.example.com")).toBe("hi");
  });

  it("caps the length at 50 characters", () => {
    expect(orgSlugFromEmail(`${"a".repeat(80)}@example.com`)).toHaveLength(50);
  });
});
