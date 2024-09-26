import { getSquiggleErrorAdvice } from "./squiggleErrorSuggestions.js";
import { getSquiggleWarningsAsString } from "./squiggleWarnings.js";

// Main function to get Squiggle advice
export function getSquiggleAdvice(errorMessage: string, code: string): string {
  const errorAdvice = getSquiggleErrorAdvice(errorMessage);
  const warningsAdvice = getSquiggleWarningsAsString(code);

  const sections = [];

  if (errorAdvice) {
    sections.push("## Error Information\n\n" + errorAdvice);
  }

  if (warningsAdvice) {
    sections.push("## Code Warnings\n\n" + warningsAdvice);
  }

  return sections.length > 0
    ? sections.join("\n\n")
    : "No errors or warnings found.";
}
