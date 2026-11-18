import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { javascriptRouteTreePlugin, routeTreeDependencyScanPlugin } from "./javascript-route-tree";

const generated = `// @ts-nocheck
export const routeTree = { id: "auth" }

import type { getRouter } from './router.jsx'
declare module '@tanstack/react-start' {
  interface Register { router: ReturnType<typeof getRouter> }
}
`;
const fixtures = [];
afterEach(() => {
  for (const directory of fixtures.splice(0)) rmSync(directory, { recursive: true, force: true });
});

describe("JavaScript generated route loading", () => {
  it("loads generated routes repeatedly without changing the generator's file or timestamp", () => {
    const directory = mkdtempSync(join(tmpdir(), "olympic-route-tree-"));
    fixtures.push(directory);
    const path = join(directory, "routeTree.gen.js");
    writeFileSync(path, generated);
    const mtime = statSync(path).mtimeMs;
    const plugin = javascriptRouteTreePlugin(path);
    expect(plugin.load(path).code).toBe('export const routeTree = { id: "auth" }\n');
    expect(plugin.load(`${path}?t=123`).code).toBe(plugin.load(path).code);
    expect(routeTreeDependencyScanPlugin(path).load(path).code).toBe(plugin.load(path).code);
    expect(readFileSync(path, "utf8")).toBe(generated);
    expect(statSync(path).mtimeMs).toBe(mtime);
  });

  it("keeps the client and SSR transforms valid and idempotent", () => {
    const plugin = javascriptRouteTreePlugin("/app/routeTree.gen.js");
    const loaded = plugin.transform(generated.replaceAll("\n", "\r\n"), "/app/routeTree.gen.js");
    expect(loaded.code).not.toContain("import type");
    expect(loaded.code).toContain('export const routeTree = { id: "auth" }');
    expect(plugin.transform(loaded.code, "/app/routeTree.gen.js").code).toBe(loaded.code);
  });

  it("leaves auth pages and other modules untouched", () => {
    const plugin = javascriptRouteTreePlugin("/app/routeTree.gen.js");
    expect(plugin.load("/app/routes/auth.jsx")).toBeNull();
    expect(plugin.transform(generated, "/app/routes/auth.jsx")).toBeNull();
  });
});
