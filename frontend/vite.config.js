// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { existsSync, readFileSync, watch, writeFileSync } from "node:fs";
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

function isGeneratedRouteTree(id) {
  return id.split("?")[0].replaceAll("\\", "/") === routeTreePath.replaceAll("\\", "/");
}

const javascriptRouteTreePlugin = {
  name: "biodoraia:javascript-route-tree",
  // TanStack Start writes a TypeScript-only registration footer even when
  // disableTypes is enabled. Run before React/OXC so SSR never parses that footer.
  enforce: "pre",
  configResolved: sanitizeGeneratedRouteTree,
  configureServer(server) {
    sanitizeGeneratedRouteTree();
    const routeTreeWatcher = watch(routeTreePath, { persistent: false }, () => {
      sanitizeGeneratedRouteTree();
    });
    server.httpServer?.once("close", () => routeTreeWatcher.close());
  },
  buildStart: sanitizeGeneratedRouteTree,
  buildEnd: sanitizeGeneratedRouteTree,
  closeBundle: sanitizeGeneratedRouteTree,
  watchChange: sanitizeGeneratedRouteTree,
  load(id) {
    if (!isGeneratedRouteTree(id)) return null;
    sanitizeGeneratedRouteTree();
    return {
      code: removeGeneratedTypeFooter(readFileSync(routeTreePath, "utf8")),
      map: null,
    };
  },
  transform(source, id) {
    if (!isGeneratedRouteTree(id)) return null;
    sanitizeGeneratedRouteTree();
    return {
      code: removeGeneratedTypeFooter(source),
      map: null,
    };
  },
};

const lovableConfig = defineConfig({
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

export default async function config(env) {
  const resolvedConfig = await lovableConfig(env);
  return {
    ...resolvedConfig,
    resolve: {
      ...resolvedConfig.resolve,
      tsconfigPaths: true,
    },
    // Lovable 2.7 still injects the legacy plugin; Vite 8 resolves these paths natively.
    plugins: resolvedConfig.plugins.filter((plugin) => plugin?.name !== "vite-tsconfig-paths"),
  };
}
