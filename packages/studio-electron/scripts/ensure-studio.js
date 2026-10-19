// Builds @quri/squiggle-studio (server + client) if it hasn't been built yet.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const studioDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../studio"
);
const built = ["dist/server/index.js", "dist/client/index.html"].every((f) =>
  fs.existsSync(path.join(studioDir, f))
);
if (!built) {
  console.log("Building @quri/squiggle-studio...");
  execSync("pnpm run build", { cwd: studioDir, stdio: "inherit" });
}
