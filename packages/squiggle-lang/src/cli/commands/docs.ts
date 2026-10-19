import { Command } from "@commander-js/extra-typings";

import { getRegistry } from "../../library/registry/index.js";
import { FnDocumentation } from "../../library/registry/core.js";
import { suggestBuiltinNames } from "../../public/hints.js";
import { bold, green, yellow } from "../colors.js";

export type FnDocJson = {
  fullName: string;
  name: string;
  namespace: string;
  aliases: string[];
  section?: string;
  description?: string;
  signatures: string[];
  examples: string[];
  shorthand?: string;
};

function fullName(fn: FnDocumentation) {
  return fn.nameSpace ? `${fn.nameSpace}.${fn.name}` : fn.name;
}

function fnToJson(fn: FnDocumentation): FnDocJson {
  const name = fullName(fn);
  const aliases = [
    ...(fn.requiresNamespace || !fn.nameSpace ? [] : [fn.name]),
    ...(fn.name === "make" ? [fn.nameSpace] : []),
  ];
  return {
    fullName: name,
    name: fn.name,
    namespace: fn.nameSpace,
    aliases,
    ...(fn.displaySection ? { section: fn.displaySection } : {}),
    ...(fn.description ? { description: fn.description.trim() } : {}),
    signatures: fn.signatures.map((s) => `${name}${s}`),
    examples: (fn.examples ?? []).map((e) => e.text),
    ...(fn.shorthand
      ? {
          shorthand:
            fn.shorthand.type === "infix"
              ? `a ${fn.shorthand.symbol} b`
              : `${fn.shorthand.symbol}a`,
        }
      : {}),
  };
}

// Documented functions, excluding internal unit helpers like `fromUnit_k`.
function allDocs(): FnDocJson[] {
  return getRegistry()
    .allFunctionDocumentation()
    .filter((fn) => !fn.isUnit && fn.nameSpace !== "")
    .map(fnToJson);
}

function namespaces(docs: FnDocJson[]) {
  const counts = new Map<string, number>();
  for (const doc of docs) {
    counts.set(doc.namespace, (counts.get(doc.namespace) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

type DocsResult =
  | { type: "namespaces"; namespaces: { name: string; count: number }[] }
  | { type: "namespace"; namespace: string; functions: FnDocJson[] }
  | { type: "functions"; query: string; functions: FnDocJson[] }
  | { type: "search"; query: string; matches: FnDocJson[] }
  | { type: "notFound"; query: string; suggestions: string[] };

function lookup(query: string | undefined, docs: FnDocJson[]): DocsResult {
  if (!query) {
    return { type: "namespaces", namespaces: namespaces(docs) };
  }
  const q = query.toLowerCase();

  // Namespace, e.g. "Dist".
  const namespace = namespaces(docs).find((n) => n.name.toLowerCase() === q);
  if (namespace) {
    return {
      type: "namespace",
      namespace: namespace.name,
      functions: docs.filter((d) => d.namespace === namespace.name),
    };
  }

  // Exact function name, e.g. "Dist.normal" or "normal" (which also matches "Sym.normal").
  const exact = docs.filter(
    (d) =>
      d.fullName.toLowerCase() === q ||
      d.name.toLowerCase() === q ||
      d.aliases.some((a) => a.toLowerCase() === q)
  );
  if (exact.length) {
    return { type: "functions", query, functions: exact };
  }

  // Fuzzy: names containing the query, then descriptions containing it.
  const score = (d: FnDocJson): number | undefined => {
    const name = d.name.toLowerCase();
    if (name === q) return 0;
    if (name.startsWith(q)) return 1;
    if (d.fullName.toLowerCase().includes(q)) return 2;
    if (d.description?.toLowerCase().includes(q)) return 3;
    return undefined;
  };
  const matches = docs
    .map((d) => ({ d, s: score(d) }))
    .filter((x): x is { d: FnDocJson; s: number } => x.s !== undefined)
    .sort((a, b) => a.s - b.s || a.d.fullName.localeCompare(b.d.fullName))
    .map((x) => x.d);

  if (matches.length === 1) {
    return { type: "functions", query, functions: matches };
  }
  if (matches.length) {
    return { type: "search", query, matches };
  }
  const lastSegment = query.split(".").pop() ?? query;
  const suggestions = [
    ...new Set([
      ...suggestBuiltinNames(query, 5),
      ...suggestBuiltinNames(lastSegment, 5),
    ]),
  ].slice(0, 5);
  return { type: "notFound", query, suggestions };
}

function formatFn(doc: FnDocJson): string {
  const lines = [bold(doc.fullName)];
  if (doc.aliases.length) {
    lines.push(`Also available as: ${doc.aliases.join(", ")}`);
  }
  if (doc.shorthand) {
    lines.push(`Shorthand: ${doc.shorthand}`);
  }
  if (doc.section) {
    lines.push(`Section: ${doc.section}`);
  }
  if (doc.description) {
    lines.push("", doc.description);
  }
  if (doc.signatures.length) {
    lines.push("", bold("Signatures:"), ...doc.signatures.map((s) => "  " + s));
  }
  if (doc.examples.length) {
    lines.push(
      "",
      bold("Examples:"),
      ...doc.examples.map((e) => e.replace(/^/gm, "  "))
    );
  }
  return lines.join("\n");
}

// First sentence of the description, truncated, for one-line listings.
function shortDescription(text: string | undefined): string | undefined {
  const line = text?.split("\n").find((l) => l.trim() !== "");
  if (!line) return undefined;
  const sentence = line.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? line;
  return sentence.length > 100 ? sentence.slice(0, 97) + "..." : sentence;
}

function formatSummaryLine(doc: FnDocJson): string {
  const summary = shortDescription(doc.description) ?? doc.signatures[0] ?? "";
  return `  ${green(doc.fullName)}  ${summary}`;
}

function printText(result: DocsResult) {
  switch (result.type) {
    case "namespaces":
      console.log(bold("Namespaces:"));
      for (const { name, count } of result.namespaces) {
        console.log(`  ${green(name)} (${count})`);
      }
      console.log(
        "\nRun `squiggle docs <Namespace>` to list functions, or `squiggle docs <Namespace.fn>` for details."
      );
      break;
    case "namespace": {
      console.log(bold(`${result.namespace} (${result.functions.length})`));
      const bySection = new Map<string, FnDocJson[]>();
      for (const fn of result.functions) {
        const section = fn.section ?? "";
        bySection.set(section, [...(bySection.get(section) ?? []), fn]);
      }
      for (const [section, fns] of bySection) {
        if (section) console.log(`\n ${yellow(section)}`);
        fns.forEach((fn) => console.log(formatSummaryLine(fn)));
      }
      break;
    }
    case "functions":
      console.log(result.functions.map(formatFn).join("\n\n---\n\n"));
      break;
    case "search":
      console.log(
        bold(`${result.matches.length} matches for "${result.query}":`)
      );
      for (const fn of result.matches) {
        console.log(formatSummaryLine(fn));
      }
      break;
    case "notFound":
      console.error(`No documentation found for "${result.query}".`);
      if (result.suggestions.length) {
        console.error(`Did you mean: ${result.suggestions.join(", ")}?`);
      }
      console.error("Run `squiggle docs --list` to see all namespaces.");
      break;
    default:
      throw new Error(`Unknown result ${result satisfies never}`);
  }
}

export function addDocsCommand(program: Command) {
  program
    .command("docs")
    .description("Show offline documentation for builtin functions")
    .arguments("[query]")
    .option("--json", "print JSON instead of text")
    .option("-l, --list", "list all namespaces")
    .addHelpText(
      "after",
      `
Examples:
  $ squiggle docs --list          # all namespaces
  $ squiggle docs Dist            # functions in a namespace
  $ squiggle docs Dist.normal     # one function: signatures, examples
  $ squiggle docs lognormal       # fuzzy search by name or description
  $ squiggle docs List.map --json`
    )
    .action((query, options) => {
      const result = lookup(options.list ? undefined : query, allDocs());
      if (result.type === "notFound") {
        process.exitCode = 1;
      }
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printText(result);
      }
    });
}
