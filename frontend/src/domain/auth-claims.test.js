import { describe, expect, it } from "vitest";
import { hasTeacherAccess } from "./auth-claims";

describe("hasTeacherAccess", () => {
  it("libera apenas a claim booleana teacher", () => {
    expect(hasTeacherAccess({ teacher: true })).toBe(true);
    expect(hasTeacherAccess({ teacher: false })).toBe(false);
    expect(hasTeacherAccess({ teacher: "true" })).toBe(false);
    expect(hasTeacherAccess({})).toBe(false);
  });
});
