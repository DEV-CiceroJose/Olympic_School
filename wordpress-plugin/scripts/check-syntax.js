import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function javascriptFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? javascriptFiles(path) : entry.name.endsWith(".js") ? [path] : [];
  });
}

for (const file of javascriptFiles(fileURLToPath(new URL("../src", import.meta.url)))) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}
