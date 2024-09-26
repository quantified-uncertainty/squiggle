// Utility type
type InvalidElement = {
  check: (line: string) => boolean;
  getMessage: (lineNumber: number) => string;
};

type WarningType =
  | "CHECK_IMPORT_STATEMENTS_ARE_ON_TOP"
  | "CHECK_INVALID_COMMAS"
  | "CHECK_ANNOTATIONS_AND_COMMENTS"
  | "CHECK_INVALID_SQUIGGLE_ELEMENTS"
  | "CHECK_DIFF_ARTIFACTS"
  | "CHECK_CAPITALIZED_VARIABLE_NAMES"
  | "CHECK_IF_WITHOUT_ELSE";

type Warning = {
  type: WarningType;
  lineNumber: number;
  message: string;
};

const commonUndefinedElements = [
  "List.sum",
  "List.map2",
  "List.keys",
  "List.sample",
  "List.sampleN",
  "List.repeat",
  "Number.parseFloat",
  "Duration.toMonths",
];

// Function to check for invalid Squiggle elements
function getInvalidSquiggleElements(): InvalidElement[] {
  return [
    {
      check: (line: string) => /\b(null|nil|undefined)\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: The use of 'null', 'nil', or 'undefined' is not valid in Squiggle. Use an empty string, false, or a custom 'None' value for representing absence of a value.`,
    },
    {
      check: (line: string) => {
        if (line.trim().startsWith("@")) return false;
        const withoutStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
        return /\b\w+\s*:\s*[A-Z]\w+(?:\s*[,)]|$)/.test(withoutStrings);
      },
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: Type annotation like 'variableName: Type' is not valid in Squiggle. Squiggle uses structural typing and doesn't require explicit type annotations.`,
    },
    {
      check: (line: string) => {
        return commonUndefinedElements.some(
          (element) =>
            new RegExp(`\\b${element}\\b`).test(line) &&
            !line.includes(`${element} is not defined`)
        );
      },
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: A common function or object (like List.sum, Number.parseFloat, etc.) is used but not defined in Squiggle. Check for typos or missing imports. Some functions might have different names or implementations in Squiggle.`,
    },
    {
      check: (line: string) => /\bDate\.now\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: 'Date.now' is not available in Squiggle. Use 'Danger.now' instead for the current timestamp. Be cautious with time-dependent calculations as they may produce varying results.`,
    },
  ];
}

// Function to check for invalid Squiggle elements
export function checkInvalidSquiggleElements(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  const invalidElements = getInvalidSquiggleElements();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    invalidElements.forEach((element) => {
      if (element.check(line)) {
        warnings.push({
          type: "CHECK_INVALID_SQUIGGLE_ELEMENTS",
          lineNumber: lineNumber,
          message: element.getMessage(lineNumber),
        });
      }
    });
  });

  return warnings;
}

// Function to check if import statements are at the top
function checkImportStatementsAreOnTop(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  let foundNonImport = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine === "" || trimmedLine.startsWith("//")) {
      continue;
    }

    if (!foundNonImport && !trimmedLine.startsWith("import")) {
      foundNonImport = true;
    }

    if (trimmedLine.startsWith("import")) {
      if (foundNonImport) {
        warnings.push({
          type: "CHECK_IMPORT_STATEMENTS_ARE_ON_TOP",
          lineNumber: i + 1,
          message: `Import statement found after non-import code. Move all imports to the top of the file for better organization and to avoid potential errors.`,
        });
      }
    }
  }

  return warnings;
}

// Function to check annotations and comments
export function checkAnnotationsAndComments(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  let lastAnnotationLine = -1;
  let lastAnnotationName = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.startsWith("@")) {
      if (lastAnnotationLine !== -1 && i - lastAnnotationLine > 1) {
        warnings.push({
          type: "CHECK_ANNOTATIONS_AND_COMMENTS",
          lineNumber: lastAnnotationLine + 1,
          message: `Lines ${lastAnnotationLine + 1}-${i}: Comments or blank lines found between annotations. Keep annotations together for clarity and to ensure they apply to the intended variable.`,
        });
      }
      lastAnnotationLine = i;
      lastAnnotationName = trimmedLine.split("(")[0].substring(1);
    } else if (lastAnnotationLine !== -1 && trimmedLine.includes("=")) {
      lastAnnotationLine = -1;
      lastAnnotationName = "";
    } else if (
      lastAnnotationLine !== -1 &&
      trimmedLine !== "" &&
      !trimmedLine.startsWith("//")
    ) {
      warnings.push({
        type: "CHECK_ANNOTATIONS_AND_COMMENTS",
        lineNumber: i + 1,
        message: `Annotation '${lastAnnotationName}' is not followed by a variable declaration. In Squiggle, annotations should refer to specific variables, not the entire file or block of code.`,
      });
      lastAnnotationLine = -1;
      lastAnnotationName = "";
    }
  }

  return warnings;
}

// Function to check for invalid commas
export function checkInvalidCommas(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  let inBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.endsWith("{")) {
      inBlock = true;
    }

    if (trimmedLine === "}") {
      inBlock = false;
    }

    if (inBlock) {
      const assignmentMatch = trimmedLine.match(/^(\w+)\s*=.*,\s*$/);
      if (assignmentMatch) {
        warnings.push({
          type: "CHECK_INVALID_COMMAS",
          lineNumber: i + 1,
          message: `Line ${i + 1}: Invalid comma at the end of variable assignment '${assignmentMatch[1]}' inside a block. In Squiggle, variable assignments within blocks should not end with commas. Remove the trailing comma to fix this issue.`,
        });
      }
    }
  }

  return warnings;
}

// Function to check for diff artifacts
export function checkDiffArtifacts(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  const diffPatterns = [/^<<<<<<< /, /^=======/, /^>>>>>>> /];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of diffPatterns) {
      if (pattern.test(line)) {
        warnings.push({
          type: "CHECK_DIFF_ARTIFACTS",
          lineNumber: i + 1,
          message: `Line ${i + 1}: Diff artifact found: "${line.trim()}". Remove this line as it's not part of the actual code.`,
        });
      }
    }
  }

  return warnings;
}

// Check for capitalized variable names. A common LLM mistake.
export function checkCapitalizedVariableNames(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  const capitalizedVarPattern = /^([A-Z][a-zA-Z0-9]*)\s*=/;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    const match = trimmedLine.match(capitalizedVarPattern);
    if (match) {
      warnings.push({
        type: "CHECK_CAPITALIZED_VARIABLE_NAMES",
        lineNumber: i + 1,
        message: `Line ${i + 1}: Variable '${match[1]}' is declared with a capitalized name.`,
      });
    }
  }

  return warnings;
}

// LLMs often assume that if statements don't need else clauses.
export function checkIfWithoutElse(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  const ifPattern = /^\s*if\s+.*\s+then\s+/;
  const elsePattern = /^\s*else\s+/;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (ifPattern.test(trimmedLine)) {
      let hasElse = false;
      // Check the next few lines for an else statement
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (elsePattern.test(lines[j].trim())) {
          hasElse = true;
          break;
        }
      }
      if (!hasElse) {
        warnings.push({
          type: "CHECK_IF_WITHOUT_ELSE",
          lineNumber: i + 1,
          message: `Line ${i + 1}: 'if' statement without a corresponding 'else'.`,
        });
      }
    }
  }

  return warnings;
}

type WarningCheck = {
  check: (code: string) => Warning[];
  additionalAdvice?: string;
};

export function getSquiggleWarnings(
  code: string
): { code: string; advice: string }[] {
  const warningChecks: WarningCheck[] = [
    {
      check: checkImportStatementsAreOnTop,
      additionalAdvice:
        "Keep all import statements at the top of the file for better organization and to avoid potential errors.",
    },
    {
      check: checkInvalidCommas,
      additionalAdvice:
        "In Squiggle, variable assignments within blocks should not end with commas. Remove trailing commas to fix this issue.",
    },
    {
      check: checkAnnotationsAndComments,
      additionalAdvice:
        "Keep annotations together and ensure they apply to specific variables. Avoid placing comments or blank lines between annotations.",
    },
    {
      check: checkInvalidSquiggleElements,
      additionalAdvice:
        "Squiggle has its own syntax and conventions. It doesn't use explicit type annotations, and certain common programming constructs (like 'null' or 'undefined') are not valid. Use Squiggle-specific alternatives when needed.",
    },
    {
      check: checkDiffArtifacts,
      additionalAdvice:
        "Remove diff artifacts (<<<<<<< HEAD, =======, >>>>>>> branch) as they are likely leftover from a merge or conflict resolution and will cause syntax errors.",
    },
    {
      check: checkCapitalizedVariableNames,
      additionalAdvice:
        "In Squiggle, start variable names with lowercase letters. Capitalized names are typically reserved for constants or special constructs.",
    },
    {
      check: checkIfWithoutElse,
      additionalAdvice:
        "In Squiggle, 'if' statements must always have an 'else' clause. Add an 'else' clause to fix this issue.",
    },
  ];

  const adviceList: { code: string; advice: string }[] = [];

  for (const { check, additionalAdvice } of warningChecks) {
    const warnings = check(code);
    if (warnings.length > 0) {
      let advice = warnings.map((w) => w.message).join("\n");
      if (additionalAdvice) {
        advice += `\n\nAdvice: ${additionalAdvice}`;
      }
      adviceList.push({ code, advice });
    }
  }

  return adviceList;
}

// New function to convert warnings to a single string
export function getSquiggleWarningsAsString(code: string): string | undefined {
  const warningsList = getSquiggleWarnings(code);

  if (warningsList.length === 0) {
    return undefined;
  }

  return warningsList
    .map(({ advice }, index) => `Warning ${index + 1}:\n${advice}`)
    .join("\n\n");
}
