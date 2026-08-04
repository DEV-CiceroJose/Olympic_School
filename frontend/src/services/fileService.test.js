import { describe, expect, it } from "vitest";
import { fileService, MAX_ATTACHMENTS } from "./fileService";

describe("fileService attachment limits", () => {
  it("rejects more attachments than Firestore accepts", async () => {
    const existing = Array.from({ length: MAX_ATTACHMENTS }, (_, index) => ({
      id: `file-${index}`,
      size: 1,
    }));
    await expect(
      fileService.uploadMany([{ name: "extra.txt", size: 1 }], existing),
    ).rejects.toThrow("no máximo 5 anexos");
  });

  it("rejects a combined payload larger than 20 MB before reading files", async () => {
    const existing = [{ id: "large", size: 19 * 1024 * 1024 }];
    await expect(
      fileService.uploadMany([{ name: "extra.pdf", size: 2 * 1024 * 1024 }], existing),
    ).rejects.toThrow("no máximo 20 MB");
  });
});
