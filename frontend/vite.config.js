// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const routeTreePath = fileURLToPath(new URL("./src/routeTree.gen.js", import.meta.url));

function removeGeneratedTypeFooter(source) {
  const sanitized = source
    .replace(/^\/\/ @ts-nocheck\r?\n/m, "")
    .replace(/\r?\nimport type \{ getRouter \}[\s\S]*$/, "");
  return `${sanitized.trimEnd()}\n`;
}

function sanitizeGeneratedRouteTree() {
  if (!existsSync(routeTreePath)) return;
  const source = readFileSync(routeTreePath, "utf8");
  const sanitized = removeGeneratedTypeFooter(source);
  if (sanitized !== source) {
    writeFileSync(routeTreePath, sanitized);
  }
}

const javascriptRouteTreePlugin = {
  name: "biodoraia:javascript-route-tree",
  enforce: "post",
  buildStart: sanitizeGeneratedRouteTree,
  buildEnd: sanitizeGeneratedRouteTree,
  closeBundle: sanitizeGeneratedRouteTree,
  transform(source, id) {
    if (id.split("?")[0].replaceAll("\\", "/") !== routeTreePath.replaceAll("\\", "/")) {
      return null;
    }
    sanitizeGeneratedRouteTree();
    return {
      code: removeGeneratedTypeFooter(source),
      map: null,
    };
  },
};

export default defineConfig({
  plugins: [javascriptRouteTreePlugin],
  tanstackStart: {
    router: {
      generatedRouteTree: "routeTree.gen.js",
      disableTypes: true,
      enableRouteGeneration: true,
    },
    // Redirect TanStack Start's bundled server entry to src/server.js (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
