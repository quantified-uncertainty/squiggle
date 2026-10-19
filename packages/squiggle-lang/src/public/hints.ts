/**
 * Deterministic hints and warnings for common Squiggle mistakes.
 *
 * Ported (and condensed) from the heuristics that Squiggle AI uses to steer LLMs (`internal-packages/ai/src/squiggle/squiggleErrorSuggestions.ts` and `squiggleCodeWarnings.ts`). These are heuristics: they can be wrong, so they are reported as hints and warnings, never as errors.
 */
import { getStdLib } from "../library/index.js";

export type SqCodeWarning = {
  line: number; // 1-based
  message: string;
};

const TYPE_NAMES = new Set([
  "Number",
  "String",
  "Boolean",
  "Bool",
  "Date",
  "Duration",
  "Dist",
  "List",
  "Dict",
  "Array",
  "Int",
  "Float",
]);

// Removes string literals and line comments so that heuristics don't fire on text inside them.
function stripStringsAndComments(line: string): string {
  return line
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/\/\/.*$/, "");
}

function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Suggests builtin names similar to `name`. For `List.sum`, this finds `Number.sum` (same function name in another namespace) and close spellings like `List.uniq`.
 */
export function suggestBuiltinNames(name: string, limit = 3): string[] {
  const allNames = [...getStdLib().keys()].filter(
    (n) => /^[A-Za-z]/.test(n) && n !== name
  );
  const [namespace, fnName] = name.includes(".")
    ? (name.split(".", 2) as [string, string])
    : [undefined, name];

  const scored: { name: string; score: number }[] = [];
  for (const candidate of allNames) {
    const [cNamespace, cFnName] = candidate.includes(".")
      ? (candidate.split(".", 2) as [string, string])
      : [undefined, candidate];

    if (cFnName.toLowerCase() === fnName.toLowerCase()) {
      // Same function, different namespace (or different capitalization).
      scored.push({ name: candidate, score: 0 });
      continue;
    }
    if (namespace !== undefined && cNamespace !== namespace) continue;
    const distance = levenshtein(fnName.toLowerCase(), cFnName.toLowerCase());
    const threshold = Math.max(1, Math.floor(fnName.length / 3));
    if (distance <= threshold) {
      scored.push({ name: candidate, score: distance });
    }
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((s) => s.name);
}

/**
 * Returns short, actionable hints for an error message. `line` is the source line where the error happened, if known; some hints depend on it.
 */
export function getErrorHints({
  message,
  line,
}: {
  message: string;
  line?: string;
}): string[] {
  const hints: string[] = [];
  const code = line !== undefined ? stripStringsAndComments(line) : "";

  const notDefined = message.match(/^([\w.]+) is not defined/);
  if (notDefined) {
    const name = notDefined[1];
    if (["null", "nil", "undefined", "None", "none"].includes(name)) {
      hints.push(
        `Squiggle has no '${name}'. Use false, an empty string, or a dict field to represent a missing value.`
      );
    } else if (["Infinity", "INFINITY", "NaN"].includes(name)) {
      hints.push(
        "There is no Infinity constant. Use Number.maxValue / Number.minValue, or 1/0."
      );
    } else if (name === "Date.now") {
      hints.push("Use Danger.now() for the current time.");
    } else if (TYPE_NAMES.has(name) && /\w+\s*:\s*[A-Z]/.test(code)) {
      hints.push(
        `Type annotations like 'x: ${name}' are not supported. Omit the annotation, or use a domain such as 'x: [0, 100]' or 'd: [Date(2020), Date(2030)]'.`
      );
    } else {
      const suggestions = suggestBuiltinNames(name);
      if (suggestions.length) {
        hints.push(`Did you mean ${suggestions.join(", ")}?`);
      }
      if (/^[a-z]/.test(name) && !name.includes(".")) {
        hints.push(
          "Variables must be defined before use (above this line), and recursion is not supported."
        );
      } else if (name.includes(".")) {
        hints.push(
          `Run \`squiggle docs ${name.split(".")[0]}\` to list the functions in this namespace.`
        );
      }
    }
    return hints;
  }

  if (/but "#" found/.test(message)) {
    hints.push("Comments use // or /* ... */, not #.");
  }
  if (/\b(return)\b/.test(code)) {
    hints.push(
      "There is no 'return' keyword: the last expression in a block or function is its value."
    );
  }
  if (/[-+*/^]=/.test(code)) {
    hints.push(
      "Variables are immutable and compound assignment (+=, -=, ...) is not supported. Write 'x = x + 1' (shadowing) instead."
    );
  }
  if (/=>/.test(code)) {
    hints.push(
      "Arrow functions are not supported. Use 'f(x) = x + 1' or a lambda '{|x| x + 1}'."
    );
  }
  if (/^\s*[A-Z]\w*\s*(=|\()/.test(code) && /but "[=(]" found/.test(message)) {
    hints.push(
      "Variable and function names must start with a lowercase letter."
    );
  }
  if (/^\s*import\b/.test(code)) {
    hints.push("Imports must come before any other statements.");
  }
  if (/\bif\b/.test(code) && !/\belse\b/.test(code)) {
    hints.push(
      "'if' always needs 'then' and 'else': 'if cond then a else b' (or 'if cond { a } else { b }')."
    );
  }
  if (
    /^Expected "->".*end of input.* but "[\w"]/.test(message) &&
    !/^\s*import\b/.test(code)
  ) {
    hints.push(
      "Only the final statement of a file or block may be a bare expression; every earlier statement must be an assignment like 'x = ...'."
    );
  }
  if (/but "}" found/.test(message)) {
    hints.push(
      "A block must end with an expression that is its value, e.g. '{ a = 1; a + 1 }', not with an assignment."
    );
  }
  return hints;
}

/**
 * Line-based checks for code that is likely wrong or not idiomatic Squiggle. Unlike errors, these can be false positives.
 */
export function getCodeWarnings(code: string): SqCodeWarning[] {
  const warnings: SqCodeWarning[] = [];
  const lines = code.split("\n");
  let seenNonImport = false;
  let inBlockComment = false;

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;

    if (/^(<<<<<<< |=======$|>>>>>>> )/.test(rawLine)) {
      warnings.push({
        line: lineNumber,
        message: `Merge/diff artifact "${rawLine.trim()}" should be removed.`,
      });
      return;
    }

    let line = rawLine;
    if (inBlockComment) {
      const end = line.indexOf("*/");
      if (end === -1) return;
      line = line.slice(end + 2);
      inBlockComment = false;
    }
    line = line.replace(/\/\*.*?\*\//g, "");
    if (line.includes("/*")) {
      line = line.slice(0, line.indexOf("/*"));
      inBlockComment = true;
    }
    line = stripStringsAndComments(line);
    const trimmed = line.trim();
    if (trimmed === "") return;

    if (/^import\b/.test(trimmed)) {
      if (seenNonImport) {
        warnings.push({
          line: lineNumber,
          message:
            "Import statement after other code; move imports to the top.",
        });
      }
    } else {
      seenNonImport = true;
    }

    const nullish = trimmed.match(/\b(null|nil|undefined)\b/);
    if (nullish) {
      warnings.push({
        line: lineNumber,
        message: `'${nullish[1]}' does not exist in Squiggle; use false, "" or a dict field instead.`,
      });
    }
    if (/=>/.test(trimmed)) {
      warnings.push({
        line: lineNumber,
        message:
          "Arrow function syntax '=>' is not supported; use 'f(x) = ...' or '{|x| ...}'.",
      });
    }
    if (/\bDate\.now\b/.test(trimmed)) {
      warnings.push({
        line: lineNumber,
        message: "'Date.now' does not exist; use 'Danger.now()'.",
      });
    }
    if (/\b(Infinity|INFINITY|NEGATIVE_INFINITY)\b/.test(trimmed)) {
      warnings.push({
        line: lineNumber,
        message:
          "Infinity constants don't exist; use Number.maxValue or Number.minValue.",
      });
    }
    const capitalized = trimmed.match(/^([A-Z]\w*)\s*(=(?!=)|\(.*\)\s*=(?!=))/);
    if (capitalized) {
      warnings.push({
        line: lineNumber,
        message: `'${capitalized[1]}' starts with a capital letter; variable and function names must start lowercase.`,
      });
    }
    if (!trimmed.startsWith("@")) {
      const annotation = trimmed.match(/\b(\w+\s*:\s*([A-Z]\w*))\s*[,)]/);
      if (annotation && TYPE_NAMES.has(annotation[2])) {
        warnings.push({
          line: lineNumber,
          message: `Type annotation '${annotation[1]}' is not supported; omit it or use a domain like [0, 100].`,
        });
      }
    }
  });

  return warnings;
}
