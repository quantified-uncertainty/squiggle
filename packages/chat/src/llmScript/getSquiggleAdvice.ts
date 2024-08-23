// Utility types
type ErrorPattern = {
  pattern: RegExp;
  advice: string;
};

type InvalidElement = {
  check: (line: string) => boolean;
  getMessage: (lineNumber: number) => string;
};

// Error patterns
const getSquiggleErrorPatterns = {
  MULTIPLE_RETURNS_TOP_LEVEL:
    /Failed to evaluate Squiggle code: Expected "->", end of input, or whitespace but ".*?" found./,
  RETURN_BEFORE_ASSIGNMENT:
    /Expected "->", end of input, or whitespace but ".*?" found./,
  INVALID_COMMENT_SYNTAX:
    /Expected "\(.*?\) \{.*?\}.*, array, boolean, dict, end of input, identifier, number, string, unary operator, or whitespace but '.*?' found./,
  UNSUPPORTED_OPERATOR:
    /Expected "\(.*?\{.*?\}.*, array, boolean, dict, identifier, number, string, unary operator, or whitespace but '.*?' found./,
  BLOCK_WITHOUT_RETURN:
    /Expected "\(.*?\.*?" end of input, or whitespace but ".*?" found./,
  INVALID_BLOCK_STRUCTURE:
    / "{", array, boolean, dict, identifier, number, string, unary operator, or whitespace but/,
  UNSUPPORTED_NUMBER_TYPE: /Number is not defined/,
  UNSUPPORTED_DATE_TYPE: /Date is not defined/,
  IMPORTS_SHOULD_BE_ON_TOP:
    /Failed to evaluate Squiggle code: Expected "->", "?", assignment, end of input, operator, or whitespace/,
  MULTIPLE_RETURNS_IN_BLOCK:
    /"if", "{", array, boolean, dict, identifier, number, string, or unary operator but ".*?" found./,
  UNDEFINED_VARIABLE: /(\w+) is not defined/,
};

// Detailed advice for each error pattern
const errorAdvice = {
  MULTIPLE_RETURNS_TOP_LEVEL: `
This error occurs when you have multiple return statements at the top level of a function call. In Squiggle, every statement except the last should be a variable assignment.

Incorrect:
foo = 4
bar = foo + 3
bar
foo  // This line causes the error

Correct:
foo = 4
bar = foo + 3
foo  // Only one return value at the end

Remember, Squiggle expects each statement to either be an assignment or the final return value.
  `,

  RETURN_BEFORE_ASSIGNMENT: `
This error occurs when you've returned a statement and then tried to do a variable assignment afterward. In Squiggle, all statements except for the last must be variable assignments.

Incorrect:
result = 5
result  // This line implicitly returns the value
extraVar = 10  // This line causes the error

Correct:
extraVar = 10
result = 5
result  // Final return value

Remember, Squiggle doesn't use semicolons to end statements, and the last statement should be the return value.
  `,

  INVALID_COMMENT_SYNTAX: `
This error often occurs when you use "#" for comments, which is not valid in Squiggle. Instead, use "//" for single-line comments or "/* */" for multi-line comments.

Incorrect:
# This is not a valid comment in Squiggle
x = 5

Correct:
// This is a valid single-line comment
x = 5

/* This is a valid
   multi-line comment */
y = 10

Ensure all your function calls, variable names, and operators are valid Squiggle syntax.
  `,

  UNSUPPORTED_OPERATOR: `
This error typically occurs when you try to use compound assignment operators like "+=", "-=", or similar, which are not allowed in Squiggle because variables cannot be mutated.

Incorrect:
x = 5
x += 3  // This will cause an error

Correct:
x = 5
x = x + 3  // This creates a new 'x' variable

Remember, in Squiggle, all variables are immutable. You're not changing existing variables, but creating new ones with the same name.
  `,

  BLOCK_WITHOUT_RETURN: `
This error often indicates that you have a block without a return statement. In Squiggle, the last expression in a block is implicitly returned.

Incorrect:
foo = {
  a = 1
  b = a + 3
}  // This block doesn't explicitly return anything

Correct:
foo = {
  a = 1
  a + 3  // This value will be implicitly returned
}

Remember, in Squiggle, you don't use an explicit 'return' keyword. The last expression in a block is automatically used as the return value.
  `,

  INVALID_BLOCK_STRUCTURE: `
This error typically means that you have a block without a proper return statement or you're trying to return multiple values from a block. In Squiggle, a block should return a single value.

Incorrect:
foo = {
  a = 1
  b = a + 3
  a
  b  // Trying to return multiple values
}

Correct (returning a single value):
foo = {
  a = 1
  b = a + 3
  b  // Only this value will be returned
}

Correct (returning a dictionary if you need multiple values):
foo = {
  a = 1
  b = a + 3
  {a: a, b: b}  // Return a dictionary with both values
}

Remember, in Squiggle, blocks and functions should return a single value. If you need to return multiple values, consider using a dictionary or an array.
  `,

  UNSUPPORTED_NUMBER_TYPE: `
This error occurs when you're trying to use 'Number' as a type, which is not supported in Squiggle. Domains in Squiggle are very restricted.

Incorrect:
myFunction(x: Number) = x + 1  // 'Number' is not a valid type annotation

Correct:
myFunction(x) = x + 1  // No type annotation needed

If you need to specify a range for a number, you can use the range syntax:
myFunction(x: [0, 100]) = x + 1  // This specifies that x should be between 0 and 100

Remember, Squiggle has a different type system compared to many other languages. It doesn't use explicit type annotations in the same way.
  `,

  UNSUPPORTED_DATE_TYPE: `
This error occurs when you're trying to use 'Date' as a type, which is not supported in Squiggle. Domains in Squiggle are very restricted.

Incorrect:
myFunction(d: Date) = d  // 'Date' is not a valid type annotation

Correct:
myFunction(d) = d  // No type annotation needed

If you need to work with dates, use the Date constructor:
today = Date(2023, 5, 15)  // Creates a date object for May 15, 2023

For date ranges, you can use:
myFunction(d: [Date(2020), Date(2030)]) = d  // This specifies that d should be a date between 2020 and 2030

Remember, while Squiggle has a Date type, it doesn't support using it as a type annotation. Instead, use the Date constructor and range syntax when needed.
  `,

  IMPORTS_SHOULD_BE_ON_TOP: `
This error occurs when you have an import statement that's not at the top of the file. In Squiggle, all import statements must be placed at the beginning of the file.

Incorrect:
x = 5
import "someModule" as mod  // This will cause an error

Correct:
import "someModule" as mod
x = 5

Remember, Squiggle has a specific syntax for imports. Always place imports at the top of the file, before any other code.
  `,

  MULTIPLE_RETURNS_IN_BLOCK: `
This error typically occurs when you have multiple return statements in a block. In Squiggle, you can only have one return value at the end of a block. Everything else should be a variable declaration.

Incorrect:
myFunction = {
  if (condition) {
    return 5  // 'return' keyword is not used in Squiggle
  } else {
    return 10
  }
}

Correct:
myFunction = {
  result = if (condition) {
    5
  } else {
    10
  }
  result  // This is the implicit return value of the block
}

Remember, Squiggle uses a specific syntax for control structures and doesn't use explicit 'return' statements. The last expression in a block is automatically used as the return value.
  `,

  UNDEFINED_VARIABLE: `
This error occurs when you're trying to use a variable or function that hasn't been defined. Here are some common scenarios and solutions:

1. Typos in variable or function names:
   Incorrect: resutl = 10  // Typo in 'result'
   Correct: result = 10

2. Using a variable before it's defined:
   Incorrect:
   x = y + 1  // 'y' is not defined yet
   y = 5

   Correct:
   y = 5
   x = y + 1

3. Forgetting to import a module:
   If you're trying to use a function from a module, make sure you've imported it:
   import "someModule" as mod
   result = mod.someFunction()

4. Scope issues:
   Variables defined inside a block are not accessible outside:
   Incorrect:
   myFunction = {
     x = 10
   }
   y = x  // 'x' is not defined in this scope

   Correct:
   myFunction = {
     x = 10
     x  // Return x from the function
   }
   y = myFunction()

5. Recursive functions:
   Note that Squiggle doesn't allow for recursive function calls. If you're trying to use recursion, you'll need to find an alternative approach, such as iteration or a different algorithm.

Remember to check your spelling, ensure all variables are defined before use, and be mindful of scope when accessing variables. If you're using a function from a module, make sure the module is imported correctly.
  `,
};

// Function to get advice for a specific error
function getSquiggleErrorAdvice(errorKey: string): string {
  return (
    errorAdvice[errorKey] || "No specific advice available for this error."
  );
}

// Function to check for invalid Squiggle elements
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

// Function to check if import statements are at the top
function checkImportStatementsAreOnTop(code: string): string[] {
  const warnings: string[] = [];
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
        warnings.push(
          `Line ${i + 1}: Import statement found after non-import code. Move all imports to the top of the file for better organization and to avoid potential errors.`
        );
      }
    }
  }

  return warnings;
}

// Function to check annotations and comments
function checkAnnotationsAndComments(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  let lastAnnotationLine = -1;
  let lastAnnotationName = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.startsWith("@")) {
      if (lastAnnotationLine !== -1 && i - lastAnnotationLine > 1) {
        warnings.push(
          `Lines ${lastAnnotationLine + 1}-${i}: Comments or blank lines found between annotations. Keep annotations together for clarity and to ensure they apply to the intended variable.`
        );
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
      warnings.push(
        `Line ${i + 1}: Annotation '${lastAnnotationName}' is not followed by a variable declaration. In Squiggle, annotations should refer to specific variables, not the entire file or block of code.`
      );
      lastAnnotationLine = -1;
      lastAnnotationName = "";
    }
  }

  return warnings;
}

// Function to check for invalid commas
function checkInvalidCommas(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  let inBlock = false;
  let blockStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmedLine = lines[i].trim();

    if (trimmedLine.endsWith("{")) {
      inBlock = true;
      blockStartLine = i + 1;
    }

    if (trimmedLine === "}") {
      inBlock = false;
    }

    if (inBlock) {
      const assignmentMatch = trimmedLine.match(/^(\w+)\s*=.*,\s*$/);
      if (assignmentMatch) {
        warnings.push(
          `Line ${i + 1}: Invalid comma at the end of variable assignment '${assignmentMatch[1]}' inside a block. In Squiggle, variable assignments within blocks should not end with commas. Remove the trailing comma to fix this issue.`
        );
      }
    }
  }

  return warnings;
}

// Function to check for diff artifacts
function checkDiffArtifacts(code: string): string[] {
  const warnings: string[] = [];
  const lines = code.split("\n");
  const diffPatterns = [/^<<<<<<< /, /^=======/, /^>>>>>>> /];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of diffPatterns) {
      if (pattern.test(line)) {
        warnings.push(
          `Line ${i + 1}: Diff artifact found: "${line.trim()}". Remove this line as it's not part of the actual code.`
        );
      }
    }
  }

  return warnings;
}

// Main function to get Squiggle advice
export function getSquiggleAdvice(errorMessage: string, code: string): string {
  let advice = "";

  // Check for error-based advice
  for (const [errorKey, pattern] of Object.entries(getSquiggleErrorPatterns)) {
    if (pattern.test(errorMessage)) {
      advice += getSquiggleErrorAdvice(errorKey) + "\n\n";
      break;
    }
  }

  // Check for import statement issues
  const importWarnings = checkImportStatementsAreOnTop(code);
  if (importWarnings.length > 0) {
    advice +=
      "Import Statement Warnings:\n" + importWarnings.join("\n") + "\n\n";
  }

  // Check for invalid commas
  const commaWarnings = checkInvalidCommas(code);
  if (commaWarnings.length > 0) {
    advice +=
      "Invalid Comma Usage Warnings:\n" + commaWarnings.join("\n") + "\n\n";
  }

  // Check for annotation and comment issues
  const annotationWarnings = checkAnnotationsAndComments(code);
  if (annotationWarnings.length > 0) {
    advice +=
      "Annotation and Comment Warnings:\n" +
      annotationWarnings.join("\n") +
      "\n\n";
  }

  // Check for invalid elements in the code
  const elementWarnings = checkInvalidSquiggleElements(code);
  if (elementWarnings.length > 0) {
    advice += "Additional Warnings:\n" + elementWarnings.join("\n") + "\n\n";
    advice +=
      "Remember that Squiggle has its own syntax and conventions. It doesn't use explicit type annotations, and certain common programming constructs (like 'null' or 'undefined') are not valid. Use Squiggle-specific alternatives when needed.\n";
  }

  // Check for diff artifacts
  const diffWarnings = checkDiffArtifacts(code);
  if (diffWarnings.length > 0) {
    advice += "Diff Artifact Warnings:\n" + diffWarnings.join("\n") + "\n\n";
    advice +=
      "These diff artifacts are likely leftover from a merge or conflict resolution. Remove them to ensure your code runs correctly.\n\n";
  }

  return advice.trim();
}
