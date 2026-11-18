import { describe, expect, it } from "vitest";
import { validAssessmentImage, MAX_ASSESSMENT_IMAGE_LENGTH } from "@/domain/assessment-image";
import { prepareAssessmentImage } from "./assessment-image-upload";

describe("assessment image input", () => {
  it("accepts bounded raster data and existing HTTPS images", () => {
    expect(validAssessmentImage("data:image/webp;base64,UklGRg==")).toBe(true);
    expect(validAssessmentImage("https://example.com/image.png")).toBe(true);
    expect(validAssessmentImage("")).toBe(true);
  });

  it("rejects SVG, executable URLs, malformed base64 and oversized images", () => {
    for (const value of [
      "data:image/svg+xml;base64,PHN2Zz4=",
      "javascript:alert(1)",
      "http://example.com/a.png",
      "data:image/png;base64,%%%",
      `data:image/png;base64,${"A".repeat(MAX_ASSESSMENT_IMAGE_LENGTH)}`,
    ]) {
      expect(validAssessmentImage(value)).toBe(false);
    }
  });

  it("rejects unsupported and oversized input files before processing", async () => {
    await expect(prepareAssessmentImage({ type: "application/pdf", size: 100 })).rejects.toThrow(
      "imagem",
    );
    await expect(
      prepareAssessmentImage({ type: "image/png", size: 11 * 1024 * 1024 }),
    ).rejects.toThrow("10 MB");
  });
});
