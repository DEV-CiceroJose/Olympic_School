import { describe, expect, it } from "vitest";
import {
  assessmentTiming,
  formatDuration,
  registeredSchoolClass,
  reportInsights,
  resultLevel,
} from "./assessment";

describe("assessment domain", () => {
  it("uses the registered school class and recognizes older supported spellings", () => {
    expect(registeredSchoolClass("2º TETB")).toBe("2º TETB");
    expect(registeredSchoolClass(" 3 dsa ")).toBe("3º DSA");
    expect(registeredSchoolClass("3º ano B")).toBe("");
    expect(registeredSchoolClass(undefined)).toBe("");
  });

  it("tracks the 90-minute deadline for attempts with a legacy minimum", () => {
    const session = {
      assessmentType: "simulado",
      startedAt: "2026-09-24T12:00:00.000Z",
      earliestSubmitAt: "2026-09-24T12:30:00.000Z",
      deadlineAt: "2026-09-24T13:30:00.000Z",
    };
    expect(assessmentTiming(session, new Date("2026-09-24T12:29:59.000Z"))).toMatchObject({
      expired: false,
      secondsRemaining: 3601,
    });
    expect(assessmentTiming(session, new Date("2026-09-24T13:30:00.000Z")).expired).toBe(true);
  });

  it("formats durations and result levels", () => {
    expect(formatDuration(185)).toBe("3min 05s");
    expect(resultLevel(24)).toBe("Lacuna crítica");
    expect(resultLevel(80)).toBe("Domínio alto");
  });

  it("selects strengths and gaps from finalized results", () => {
    const insights = reportInsights(
      [],
      [
        { skillId: "a", percentage: 20 },
        { skillId: "b", percentage: 85 },
      ],
    );
    expect(insights.gaps[0].skillId).toBe("a");
    expect(insights.strengths[0].skillId).toBe("b");
  });
});
