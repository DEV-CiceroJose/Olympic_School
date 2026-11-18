import { readFileSync } from "node:fs";

function removeGeneratedTypeFooter(source) {
  const sanitized = source
    .replace(/^\/\/ @ts-nocheck\r?\n/m, "")
    .replace(/\r?\nimport type \{ getRouter \}[\s\S]*$/, "");
  return `${sanitized.trimEnd()}\n`;
}

export function javascriptRouteTreePlugin(routeTreePath) {
  const matches = (id) =>
    id.split("?")[0].replaceAll("\\", "/") === routeTreePath.replaceAll("\\", "/");
  return {
    name: "olympic-school:javascript-route-tree",
    // TanStack Start emits a TypeScript footer even with disableTypes enabled.
    // Strip it in memory before React/OXC parses it. Writing the sanitized file
    // to disk would compete with the generator and trigger an endless reload loop.
    enforce: "pre",
    load(id) {
      if (!matches(id)) return null;
      return { code: removeGeneratedTypeFooter(readFileSync(routeTreePath, "utf8")), map: null };
    },
    transform(source, id) {
      if (!matches(id)) return null;
      return { code: removeGeneratedTypeFooter(source), map: null };
    },
  };
}

// Vite's dependency scanner runs its own Rolldown pipeline, outside Vite hooks.
export function routeTreeDependencyScanPlugin(routeTreePath) {
  const { name, load } = javascriptRouteTreePlugin(routeTreePath);
  return { name: `${name}:dependency-scan`, load };
}
