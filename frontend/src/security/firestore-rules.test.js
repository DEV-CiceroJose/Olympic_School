import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const rules = readFileSync(new URL("../../../backend/firestore.rules", import.meta.url), "utf8");

describe("Firestore security contract", () => {
  it("keeps private records scoped to the authenticated uid", () => {
    expect(rules).toContain("request.auth.uid == uid");
    expect(rules).toMatch(/match \/users\/\{uid\}[\s\S]*allow get: if isOwner\(uid\)/);
  });

  it("denies unknown collections by default", () => {
    expect(rules).toContain("match /{document=**}");
    expect(rules).toContain("allow read, write: if false");
  });

  it("keeps attachment ids aligned with the client limit", () => {
    expect(rules).toContain("data.attachmentIds.size() <= 5");
  });

  it("keeps attempts and progress events immutable", () => {
    expect(rules).toMatch(/match \/attempts\/\{attemptId\}[\s\S]*allow update: if false/);
    expect(rules).toMatch(/match \/progressEvents\/\{eventId\}[\s\S]*allow update: if false/);
  });

  it("keeps diagnostic answers server-owned and answer keys teacher-only", () => {
    expect(rules).toMatch(/match \/answerKeys\/\{questionId\}[\s\S]*allow read: if isTeacher\(\)/);
    expect(rules).toMatch(
      /match \/responses\/\{responseId\}[\s\S]*allow create, update, delete: if false/,
    );
    expect(rules).toMatch(
      /match \/assessmentSessions\/\{sessionId\}[\s\S]*allow list: if isTeacher\(\)/,
    );
  });
});
