/**
 * This file contains functions to check for common warnings in Squiggle code.
 * It includes checks for invalid Squiggle elements, import statements, annotations, comments, and more.
 * The warnings are then converted to a single string for easy display.
 *
 * This code is not tested. It is used mainly to help guide the LLM in finding and fixing errors, in situations where the LLM has shown a tendency to make the same mistakes over and over again.
 */

// Utility type
type InvalidElement = {
  check: (line: string) => boolean;
  getMessage: (lineNumber: number, line: string) => string;
};

type WarningType =
  | "CHECK_IMPORT_STATEMENTS_ARE_ON_TOP"
  | "CHECK_INVALID_COMMAS"
  | "CHECK_ANNOTATIONS_AND_COMMENTS"
  | "CHECK_INVALID_SQUIGGLE_ELEMENTS"
  | "CHECK_DIFF_ARTIFACTS"
  | "CHECK_CAPITALIZED_VARIABLE_NAMES"
  | "CHECK_IF_WITHOUT_ELSE"
  | "CHECK_MULTIPLE_EXPECTS"
  | "CHECK_ADJACENT_EXPECT_STATEMENTS";

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
      getMessage: (lineNumber: number, line: string) => {
        const match = line.match(/\b(null|nil|undefined)\b/);
        const value = match ? match[1] : "null, nil, or undefined";
        return `Line ${lineNumber}: The use of '${value}' is not valid in Squiggle. Use an empty string, false, or a custom 'None' value for representing absence of a value.`;
      },
    },
    {
      check: (line: string) => {
        if (line.trim().startsWith("@")) return false;
        const withoutStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
        return /\b\w+\s*:\s*[A-Z]\w+(?:\s*[,)]|$)/.test(withoutStrings);
      },
      getMessage: (lineNumber: number, line: string) => {
        const match = line.match(/\b(\w+\s*:\s*[A-Z]\w+)/);
        const annotation = match ? match[1] : "variableName: Type";
        return `Line ${lineNumber}: Type annotation '${annotation}' is not valid in Squiggle. Squiggle uses structural typing and doesn't support explicit type annotations.`;
      },
    },
    {
      check: (line: string) => {
        return commonUndefinedElements.some(
          (element) =>
            new RegExp(`\\b${element}\\b`).test(line) &&
            !line.includes(`${element} is not defined`)
        );
      },
      getMessage: (lineNumber: number, line: string) => {
        const element = commonUndefinedElements.find((el) =>
          new RegExp(`\\b${el}\\b`).test(line)
        );
        return `Line ${lineNumber}: The function or object '${element}' is used but not defined in Squiggle. Check for typos or missing imports. Some functions might have different names or implementations in Squiggle.`;
      },
    },
    {
      check: (line: string) => /\bDate\.now\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: 'Date.now' is not available in Squiggle. Use 'Danger.now' instead for the current timestamp. Be cautious with time-dependent calculations as they may produce varying results.`,
    },
    {
      check: (line: string) =>
        /\b(Infinity|INFINITY|NegativeInfinity|NEGATIVE_INFINITY)\b/.test(line),
      getMessage: (lineNumber: number, line: string) => {
        const match = line.match(
          /\b(Infinity|INFINITY|NegativeInfinity|NEGATIVE_INFINITY)\b/
        );
        const value = match ? match[1] : "Infinity constant";
        return `Line ${lineNumber}: The ${value} constant is not valid in Squiggle. You can use Number.maxValue or Number.minValue instead.`;
      },
    },
    {
      check: (line: string) => /=>/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: The arrow function syntax "=>" is not allowed in Squiggle. Use the standard function declaration syntax instead. If you want to write a lambda function, you can do this: {|x| x + 1 }`,
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
          message: element.getMessage(lineNumber, line),
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
  const capitalizedVarPattern = /^([A-Z][a-zA-Z0-9_]*)\s*(?:=|->|\()/;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    const match = trimmedLine.match(capitalizedVarPattern);
    if (match) {
      const relevantText =
        trimmedLine.split(/=|->|\(/)[0].trim() +
        (trimmedLine.includes("(") ? "(" : "=");
      warnings.push({
        type: "CHECK_CAPITALIZED_VARIABLE_NAMES",
        lineNumber: i + 1,
        message: `Line ${i + 1}: Variable '${match[1]}' is declared with a capitalized name. Found: "${relevantText}"`,
      });
    }
  }

  return warnings;
}

// LLMs often assume that if statements don't need else clauses.
export function checkIfWithoutElse(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  const ifPattern = /^\s*(\w+\s*=\s*)?if\s+/;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (ifPattern.test(trimmedLine)) {
      let hasElse = trimmedLine.includes("else");

      // Check the next two lines for 'else' if not found on the current line
      for (let j = 1; j <= 2 && !hasElse && i + j < lines.length; j++) {
        const nextLine = lines[i + j].trim();
        hasElse = nextLine.includes("else");
      }

      if (!hasElse) {
        warnings.push({
          type: "CHECK_IF_WITHOUT_ELSE",
          lineNumber: i + 1,
          message: `Line ${i + 1}: 'if' statement without a corresponding 'else'. In Squiggle, every 'if' must have an 'else' clause.`,
        });
      }
    }
  }

  return warnings;
}

// Function to check for multiple expects in a block
export function checkMultipleExpects(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  let inBlock = false;
  let expectCount = 0;
  let blockStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.endsWith("{||")) {
      inBlock = true;
      expectCount = 0;
      blockStartLine = i + 1;
    }

    if (trimmedLine === "})") {
      inBlock = false;
    }

    if (inBlock && /\w+\.expect\(/.test(trimmedLine)) {
      expectCount++;
      if (expectCount > 1) {
        warnings.push({
          type: "CHECK_MULTIPLE_EXPECTS",
          lineNumber: i + 1,
          message: `Lines ${blockStartLine}-${i + 1}: Multiple return '.expect()' calls found in a single block. In Squiggle, you can only return one statement at the end of a block.`,
        });
        break;
      }
    }
  }

  return warnings;
}

// Function to check for adjacent expect statements
export function checkAdjacentExpectStatements(code: string): Warning[] {
  const warnings: Warning[] = [];
  const lines = code.split("\n");
  let lastExpectLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();
    if (
      trimmedLine.startsWith("expect") ||
      trimmedLine.startsWith("sTest.expect(") ||
      trimmedLine.startsWith("test.expect")
    ) {
      if (lastExpectLine !== -1 && i - lastExpectLine === 1) {
        warnings.push({
          type: "CHECK_ADJACENT_EXPECT_STATEMENTS",
          lineNumber: i + 1,
          message: `Lines ${lastExpectLine + 1}-${i + 1}: Adjacent expect statements found. Only one expect statement is allowed per test block.`,
        });
      }
      lastExpectLine = i;
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
    {
      check: checkMultipleExpects,
      additionalAdvice:
        "In Squiggle, you can only return one .expect() at the end of a block, as you're only allowed one return statement.",
    },
    {
      check: checkAdjacentExpectStatements,
      additionalAdvice:
        "Separate expect statements with at least one blank line to improve code readability and organization.",
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
