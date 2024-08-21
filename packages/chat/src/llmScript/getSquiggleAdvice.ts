type ErrorPattern = {
  pattern: RegExp;
  advice: string;
};

type InvalidElement = {
  check: (line: string) => boolean;
  getMessage: (lineNumber: number) => string;
};

function checkImportStatementsAreOnTop(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  let foundNonImport = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine === "" || trimmedLine.startsWith("//")) {
      // Skip empty lines and comments
      continue;
    }

    if (!foundNonImport && !trimmedLine.startsWith("import")) {
      foundNonImport = true;
    }

    if (trimmedLine.startsWith("import")) {
      if (foundNonImport) {
        warnings.push(
          `Line ${i + 1}: Import statement found after non-import code. Move all imports to the top of the file.`
        );
      }
    }
  }

  return warnings;
}

function checkAnnotationsAndComments(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  let lastAnnotationLine = -1;
  let lastAnnotationName = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    // Check for annotations
    if (trimmedLine.startsWith("@")) {
      if (lastAnnotationLine !== -1 && i - lastAnnotationLine > 1) {
        warnings.push(
          `Lines ${lastAnnotationLine + 1}-${i}: Comments or blank lines found between annotations. Remove them to keep annotations together.`
        );
      }
      lastAnnotationLine = i;
      lastAnnotationName = trimmedLine.split("(")[0].substring(1);
    }
    // Check for variable declaration after annotations
    else if (lastAnnotationLine !== -1 && trimmedLine.includes("=")) {
      lastAnnotationLine = -1;
      lastAnnotationName = "";
    }
    // Check for non-empty, non-comment lines that aren't variable declarations
    else if (
      lastAnnotationLine !== -1 &&
      trimmedLine !== "" &&
      !trimmedLine.startsWith("//")
    ) {
      warnings.push(
        `Line ${i + 1}: Annotation '${lastAnnotationName}' is not followed by a variable declaration. Annotations should refer to variables, not the full file.`
      );
      lastAnnotationLine = -1;
      lastAnnotationName = "";
    }
  }

  return warnings;
}

function checkInvalidCommas(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  let inBlock = false;
  let blockStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    // Check for block start
    if (trimmedLine.endsWith("{")) {
      inBlock = true;
      blockStartLine = i + 1;
    }

    // Check for block end
    if (trimmedLine === "}") {
      inBlock = false;
    }

    // Check for invalid comma if in a block
    if (inBlock) {
      const assignmentMatch = trimmedLine.match(/^(\w+)\s*=.*,\s*$/);
      if (assignmentMatch) {
        warnings.push(
          `Line ${i + 1}: Invalid comma at the end of variable assignment '${assignmentMatch[1]}' inside a block. Remove the trailing comma.`
        );
      }
    }
  }

  return warnings;
}

function getSquiggleErrorPatterns(): ErrorPattern[] {
  return [
    {
      pattern:
        /Failed to evaluate Squiggle code: Expected "->", end of input, or whitespace but ".*?" found./,
      advice: `This likely means that you are using two return statements in the top-level of the function call. 
      Every statement but the last should be a variable assignment. Don't: foo = 4; bar = foo + 3; bar; foo;
      Do: foo = 4; bar = foo + 3; foo;`,
    },
    {
      pattern: /Expected "->", end of input, or whitespace but ".*?" found./,
      advice: `This likely means the same as the above error. You returned a statement, and then had a variable assignment.
      All statements except for the last must be variable assignment.`,
    },
    {
      pattern:
        /Expected "\(.*?\) \{.*?\}.*, array, boolean, dict, end of input, identifier, number, string, unary operator, or whitespace but '.*?' found./,
      advice: `Did you use "#" as a line comment? That's not valid in Squiggle. Use "//" instead.`,
    },
    {
      pattern:
        /Expected "\(.*?\{.*?\}.*, array, boolean, dict, identifier, number, string, unary operator, or whitespace but '.*?' found./,
      advice: `Did you try using "+=" or "-=" or similar? These are not allowed in Squiggle, as you cannot mutate variables.`,
    },
    {
      pattern:
        /Expected "\(.*?\.*?" end of input, or whitespace but ".*?" found./,
      advice: `This likely means that you have a block without a return statement. Don't: foo = { a = 1 b = a + 3 }
      Do: foo = { a = 1 a + 3 }`,
    },
    {
      pattern:
        / "{", array, boolean, dict, identifier, number, string, unary operator, or whitespace but/,
      advice: `This likely means that you have a block without a return statement. Don't: foo = { a = 1 \n b = a + 3 }. Instead, return with one single value. If you instead want to return a Dict, then the format is {a:3, b:5, c:10}.`,
    },
    {
      pattern: /Number is not defined/,
      advice: `Are you trying to use Number as a Type? This is not supported. Domains are very restricted, see that documentation.`,
    },
    {
      pattern:
        /Failed to evaluate Squiggle code: Expected "->", "?", assignment, end of input, operator, or whitespace/,
      advice: `Did you have an import statement that's not on the top of the file? Make sure that all import statements are on the top of the file.`,
    },
    {
      pattern:
        /"if", "{", array, boolean, dict, identifier, number, string, or unary operator but ".*?" found./,
      advice: `Do you have two returns in a block? You can only have one, at the end. Everything else should be a variable declaration.`,
    },
    {
      pattern: /(\w+) is not defined/,
      advice: `The variable or function '$1' is not defined. If you're trying to use recursion, please note that Squiggle doesn't allow for recursive function calls. Consider using iteration or a different approach to solve your problem.`,
    },
  ];
}

// Function to define invalid Squiggle elements
function getInvalidSquiggleElements(): InvalidElement[] {
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
  return [
    {
      check: (line: string) => /\b(null|nil|undefined)\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: The use of 'null' or 'nil' is not valid in Squiggle. Use an empty string or false for null values.`,
    },
    {
      check: (line: string) => {
        // Ignore lines starting with @ (decorators)
        if (line.trim().startsWith("@")) return false;

        // Ignore content within string literals
        const withoutStrings = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');

        // Check for type annotations
        return /\b\w+\s*:\s*[A-Z]\w+(?:\s*[,)]|$)/.test(withoutStrings);
      },
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: Type annotation like 'variableName: Type' is not valid in Squiggle. Squiggle uses structural typing.`,
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
        `Line ${lineNumber}: A common function or object (like List.sum, Number, etc.) is used but not defined in Squiggle. Check for typos or missing imports.`,
    },
    {
      // New check for Date.now
      check: (line: string) => /\bDate\.now\b/.test(line),
      getMessage: (lineNumber: number) =>
        `Line ${lineNumber}: 'Date.now' is not available in Squiggle. Use 'Danger.now' instead for the current timestamp.`,
    },
  ];
}

// Function to check for invalid Squiggle elements
function checkInvalidSquiggleElements(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  const invalidElements = getInvalidSquiggleElements();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    invalidElements.forEach((element) => {
      if (element.check(line)) {
        warnings.push(element.getMessage(lineNumber));
      }
    });
  });

  return warnings;
}

// Main function to get Squiggle advice
export function getSquiggleAdvice(errorMessage: string, code: string): string {
  let advice = "";

  // Check for error-based advice
  const errorPatterns = getSquiggleErrorPatterns();
  for (const { pattern, advice: errorAdvice } of errorPatterns) {
    if (pattern.test(errorMessage)) {
      advice += errorAdvice + "\n\n";
      break; // Only use the first matching error advice
    }
  }

  // Check for import statement issues
  const importWarnings = checkImportStatementsAreOnTop(code);
  if (importWarnings.length > 0) {
    advice +=
      "Import statement warnings:\n" + importWarnings.join("\n") + "\n\n";
  }

  // Check for invalid commas
  const commaWarnings = checkInvalidCommas(code);
  if (commaWarnings.length > 0) {
    advice +=
      "Invalid comma usage warnings:\n" + commaWarnings.join("\n") + "\n\n";
  }

  // Check for annotation and comment issues
  const annotationWarnings = checkAnnotationsAndComments(code);
  if (annotationWarnings.length > 0) {
    advice +=
      "Annotation and comment warnings:\n" +
      annotationWarnings.join("\n") +
      "\n\n";
  }

  // Check for invalid elements in the code
  const warnings = checkInvalidSquiggleElements(code);
  if (warnings.length > 0) {
    advice += "Additional warnings:\n" + warnings.join("\n") + "\n\n";
    advice +=
      "Remember that Squiggle doesn't use explicit type annotations and 'null' or 'nil' are not valid. Use 'None' for optional values.\n";
  }

  return advice.trim(); // Remove any trailing whitespace
}
