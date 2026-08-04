import { describe, expect, it } from "vitest";
import {
  hasLegacyLearningCache,
  learningCacheKeys,
  LEGACY_LEARNING_CACHE_KEYS,
} from "./learning-cache";

describe("learning cache isolation", () => {
  it("uses different keys for different authenticated users", () => {
    const first = learningCacheKeys("student-a");
    const second = learningCacheKeys("student-b");
    expect(first.attempts).not.toBe(second.attempts);
    expect(first.mastery).toContain("student-a");
    expect(second.events).toContain("student-b");
  });

  it("detects legacy global data without assigning it to a new user", () => {
    const values = new Map([[LEGACY_LEARNING_CACHE_KEYS[0], "[]"]]);
    const storage = { getItem: (key) => values.get(key) ?? null };
    expect(hasLegacyLearningCache(storage)).toBe(true);
    expect(Object.values(learningCacheKeys("student-a"))).not.toContain(
      LEGACY_LEARNING_CACHE_KEYS[0],
    );
  });

  it("rejects cache access without a user id", () => {
    expect(() => learningCacheKeys("")).toThrow("UID_REQUIRED_FOR_LEARNING_CACHE");
  });
});
