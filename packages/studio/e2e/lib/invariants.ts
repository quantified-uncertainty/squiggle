import { unnamedButtons } from "./a11y.js";
import { checkContrast, formatContrastViolation } from "./contrast.js";
import type { HarnessInternal } from "./harness.js";

// Global invariants, checked after every scenario (spec §6.6):
//   no page errors; idle within 15 s; every button has an accessible name;
//   no visible text below 4.5:1 contrast; .hidden/ and node_modules/ never in
//   the tree; one keypress runs at most one command.
//
// Contrast is a failure only in strict mode (`pnpm e2e --strict`, what
// integration runs) and a warning otherwise: until every package has replaced
// its slate-400 text (QA #59), a package's branch would fail on other
// packages' surfaces. Console errors are always warnings.

export type InvariantReport = {
  failures: string[];
  warnings: string[];
};

const HIDDEN_OR_IGNORED = /(^|\/)(\.[^/]+|node_modules)(\/|$)/i;

type TreeNodeJson = { path?: unknown; children?: unknown };

function treePaths(nodes: unknown, out: string[] = []): string[] {
  if (!Array.isArray(nodes)) return out;
  for (const node of nodes as TreeNodeJson[]) {
    if (typeof node.path === "string") out.push(node.path);
    treePaths(node.children, out);
  }
  return out;
}

async function hiddenInTree(h: HarnessInternal): Promise<string[]> {
  const found: string[] = [];
  const server = h.fixtureServer.server();
  if (server) {
    const response = await fetch(`${server.url}/api/tree`, {
      headers: { "x-squiggle-studio": "1" },
    });
    const body: unknown = await response.json();
    const tree =
      typeof body === "object" && body !== null && "tree" in body
        ? body.tree
        : undefined;
    for (const p of treePaths(tree)) {
      if (HIDDEN_OR_IGNORED.test(p)) found.push(`GET /api/tree lists ${p}`);
    }
  }
  const domPaths = await h.page.evaluate(() =>
    [
      ...document.querySelectorAll(
        "[data-testid='file-tree-item'][data-path], aside button[title]"
      ),
    ].map(
      (el) => el.getAttribute("data-path") ?? el.getAttribute("title") ?? ""
    )
  );
  for (const p of domPaths) {
    // Tree rows carry root-relative paths; skip other titled buttons
    // (absolute folder paths, tooltips) in the pre-WP3 sidebar.
    if (p.startsWith("/") || p.includes(" ")) continue;
    if (HIDDEN_OR_IGNORED.test(p)) found.push(`The Explorer shows ${p}`);
  }
  return found;
}

export async function checkInvariants(
  h: HarnessInternal,
  opts: { strict: boolean }
): Promise<InvariantReport> {
  const failures: string[] = [];
  const warnings: string[] = [];

  for (const error of h.errors.page) failures.push(`Page error: ${error}`);
  failures.push(...h.idleTimeouts);
  for (const v of h.keypressViolations) {
    failures.push(`One keypress, several commands: ${v}`);
  }
  for (const snippet of await unnamedButtons(h.page)) {
    failures.push(`Button without an accessible name: ${snippet}`);
  }
  failures.push(...(await hiddenInTree(h)));

  const contrast = await checkContrast(h.page);
  for (const v of contrast.violations) {
    (opts.strict ? failures : warnings).push(
      `Contrast below 4.5:1: ${formatContrastViolation(v)}`
    );
  }
  for (const message of h.errors.console) {
    warnings.push(`Console error: ${message}`);
  }
  return { failures, warnings };
}
