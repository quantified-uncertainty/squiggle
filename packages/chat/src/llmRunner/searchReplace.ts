// 1. Convert the prompt response into an array of objects
function extractSearchReplaceBlocks(
  response: string
): Array<{ search: string; replace: string }> {
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
      const searchRegex = new RegExp(escapeRegExp(block.search), "g");
      const matchCount = (updatedText.match(searchRegex) || []).length;

      if (matchCount === 0) {
        return {
          success: false,
          value: `Error: Search text not found: "${block.search}"`,
        };
      }

      if (matchCount > 1) {
        return {
          success: false,
          value: `Error: Multiple matches found for search text: "${block.search}". Please use a larger, more specific code block.`,
        };
      }

      updatedText = updatedText.replace(searchRegex, block.replace);
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

  const blocks = extractSearchReplaceBlocks(promptResponse);

  if (blocks.length === 0) {
    return {
      success: false,
      value: "No search/replace blocks found in the response",
    };
  }

  // Apply all search/replace blocks
  return applySearchReplaceBlocks(originalText, blocks);
}
