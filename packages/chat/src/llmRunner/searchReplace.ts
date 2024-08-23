// 1. Convert the prompt response into an array of objects
function extractSearchReplaceBlocks(
  response: string
): Array<{ search: string; replace: string }> {
  const regex =
    /<<<<<<< SEARCH\s*([\s\S]*?)\s*=======\s*([\s\S]*?)\s*>>>>>>> REPLACE/g;
  const blocks: Array<{ search: string; replace: string }> = [];
  let match;

  // Check for correct syntax
  if (!/<<<<<<< SEARCH[\s\S]*=======[\s\S]*>>>>>>> REPLACE/.test(response)) {
    throw new Error("SEARCH/REPLACE syntax not correctly formatted");
  }

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
      if (block.search === "") {
        // If search is empty, prepend the replacement to the top
        updatedText = block.replace + "\n\n" + updatedText;
      } else {
        const searchRegex = new RegExp(escapeRegExp(block.search), "");
        const match = searchRegex.exec(updatedText);

        if (!match) {
          return {
            success: false,
            value: `Error: Search text not found: \n\`\`\`\n ${block.search}\n\`\`\`\n"`,
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
      value: `Error applying search/replace blocks: ${error.message}`,
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
      value: error.message,
    };
  }
}
