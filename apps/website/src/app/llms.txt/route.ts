import type { PageTree } from "fumadocs-core/server";

import { source } from "@/app/source";

// An index of the docs for language models, following https://llmstxt.org/.

export const dynamic = "force-static";

const siteUrl = "https://www.squiggle-language.com";

// Sections that are useful background but not needed to write Squiggle code.
const optionalSections = ["Discussions", "Internal", "Changelog"];

function nodeName(node: { name: unknown }): string {
  return typeof node.name === "string" ? node.name : String(node.name);
}

function pageLine(item: PageTree.Item): string {
  const page = source.getPages().find((p) => p.url === item.url);
  const description = page?.data.description?.replace(/\s+/g, " ").trim();
  return `- [${nodeName(item)}](${siteUrl}${item.url})${description ? `: ${description}` : ""}`;
}

function folderLines(folder: PageTree.Folder): string[] {
  const lines: string[] = [];
  if (folder.index) {
    lines.push(pageLine(folder.index));
  }
  for (const child of folder.children) {
    if (child.type === "page") {
      lines.push(pageLine(child));
    } else if (child.type === "folder") {
      lines.push(...folderLines(child));
    }
  }
  return lines;
}

function buildLlmsTxt(): string {
  const topLevelPages: string[] = [];
  const sections: string[] = [];
  const optional: string[] = [];

  for (const node of source.pageTree.children) {
    if (node.type === "page") {
      topLevelPages.push(pageLine(node));
    } else if (node.type === "folder") {
      const name = nodeName(node);
      // Individual release notes would only add noise; link the index page.
      const lines =
        name === "Changelog" && node.index
          ? [pageLine(node.index)]
          : folderLines(node);
      if (optionalSections.includes(name)) {
        optional.push(...lines);
      } else {
        sections.push(`## ${name}\n\n${lines.join("\n")}`);
      }
    }
  }

  return `# Squiggle

> Squiggle is a minimalist programming language for probabilistic estimation. Values can be probability distributions (for example \`5 to 10\`, a lognormal with a 90% interval from 5 to 10), and arithmetic on them uses Monte Carlo sampling. It is used for Fermi estimates, cost-benefit analyses, and forecasts with explicit uncertainty.

Squiggle is a small, immutable, expression-based language and is not JavaScript: only use functions and syntax that appear in these docs. The complete documentation, including every builtin function, is available as one plain-text file at [llms-full.txt](${siteUrl}/llms-full.txt).

Tools for coding agents:

- The \`squiggle\` CLI (\`npx @quri/squiggle-lang\`) can run models (\`squiggle run model.squiggle --json\`), check them for errors (\`squiggle check\`), and look up builtin functions offline (\`squiggle docs Dist.normal\`).
- Claude Code users can install the Squiggle plugin: \`/plugin marketplace add quantified-uncertainty/squiggle\`, then \`/plugin install squiggle@quantified-uncertainty\`.

## Full documentation

- [llms-full.txt](${siteUrl}/llms-full.txt): All of the documentation below in one plain-text file, with a list of common mistakes and the style guide first.

## Docs

${topLevelPages.join("\n")}

${sections.join("\n\n")}

## Optional

${optional.join("\n")}
`;
}

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
