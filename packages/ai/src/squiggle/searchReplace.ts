const separator = "||";
const lineNumberDigits = 3;

export function addLineNumbers(code: string): string {
  return code
    .split("\n")
    .map(
      (line, index) =>
        `${(index + 1).toString().padStart(lineNumberDigits, "0")}${separator}${line}`
    )
    .join("\n");
}

function regexHasLineNumbers(text: string): boolean {
  const lineNumberRegex = new RegExp(
    `^\\d{${lineNumberDigits}}${escapeRegExp(separator)}`,
    "m"
  );
  return lineNumberRegex.test(text);
}

function extractSearchReplaceBlocks(
  response: string
): Array<{ search: string; replace: string }> {
  const validationResult = validateResponse(response);
  if (!validationResult.isValid) {
    throw new Error(
      "SEARCH/REPLACE error: " + validationResult.error ||
        "SEARCH/REPLACE error: syntax not correctly formatted"
    );
  }

  const regex =
    /<<<<<<< SEARCH\s*([\s\S]*?)\s*=======\s*([\s\S]*?)\s*>>>>>>> REPLACE/g;
  const blocks: Array<{ search: string; replace: string }> = [];
  let match;

  while ((match = regex.exec(response)) !== null) {
    blocks.push({
      search: match[1].trim(),
      replace: match[2].trim(),
    });
  }

  return blocks;
}

function applySearchReplaceBlocks(
  originalText: string,
  blocks: Array<{ search: string; replace: string }>
): { success: boolean; value: string } {
  let updatedText = originalText;

  try {
    for (const block of blocks) {
      // Check if search and replace are identical
      if (block.search === block.replace) {
        return {
          success: false,
          value: `Error: Search and replace texts are identical: \n\`\`\`\n${block.search}\n\`\`\``,
        };
      }

      if (block.search === "") {
        // If search is empty, prepend the replacement to the top
        updatedText = block.replace + "\n\n" + updatedText;
      } else {
        const searchRegex = new RegExp(escapeRegExp(block.search), "");
        const match = searchRegex.exec(updatedText);

        if (!match) {
          return {
            success: false,
            value: `Error: Search text not found: \n\`\`\`\n${block.search}\n\`\`\``,
          };
        }

        // Replace only the first occurrence
        updatedText =
          updatedText.slice(0, match.index) +
          block.replace +
          updatedText.slice(match.index + match[0].length);
      }
    }

    return { success: true, value: updatedText };
  } catch (error) {
    return {
      success: false,
      value: `Error applying search/replace blocks: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Make sure this helper function is defined
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// The processSearchReplaceResponse function remains the same
export function processSearchReplaceResponse(
  originalText: string,
  promptResponse: string
): { success: boolean; value: string } {
  if (!promptResponse || promptResponse.trim().length === 0) {
    return {
      success: false,
      value: "Empty response received",
    };
  }

  if (regexHasLineNumbers(promptResponse)) {
    return {
      success: false,
      value: "Response contains line numbers, which is not allowed",
    };
  }

  try {
    const blocks = extractSearchReplaceBlocks(promptResponse);

    if (blocks.length === 0) {
      return {
        success: false,
        value: "No search/replace blocks found in the response",
      };
    }

    // Apply all search/replace blocks
    return applySearchReplaceBlocks(originalText, blocks);
  } catch (error) {
    return {
      success: false,
      value: error instanceof Error ? error.message : String(error),
    };
  }
}

// New function to validate the overall structure of the response
function validateResponse(response: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedResponse = response.trim();
  const searchBlocks = (trimmedResponse.match(/<<<<<<< SEARCH/g) || []).length;
  const replaceBlocks = (trimmedResponse.match(/>>>>>>> REPLACE/g) || [])
    .length;
  const separators = (trimmedResponse.match(/=======/g) || []).length;

  // Check if the number of SEARCH, REPLACE, and separator blocks match
  if (searchBlocks !== replaceBlocks || searchBlocks !== separators) {
    return {
      isValid: false,
      error: `Mismatched block count: SEARCH (${searchBlocks}), REPLACE (${replaceBlocks}), separators (${separators})`,
    };
  }

  // Check if the blocks are in the correct order
  const regex = /<<<<<<< SEARCH[\s\S]*?=======[\s\S]*?>>>>>>> REPLACE/g;
  const validBlocks = trimmedResponse.match(regex);

  if (validBlocks === null || validBlocks.length !== searchBlocks) {
    return {
      isValid: false,
      error: "Blocks are not in the correct order or format",
    };
  }

  return { isValid: true };
}
