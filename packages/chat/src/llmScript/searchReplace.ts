// 1. Convert the prompt response into an array of objects
function extractSearchReplaceBlocks(
  response: string
): Array<{ search: string; replace: string }> {
  const regex =
    /<changes>\s*<<<<<<< SEARCH\s*([\s\S]*?)\s*=======\s*([\s\S]*?)\s*>>>>>>> REPLACE\s*<\/changes>/g;
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

// 2. Apply search/replace blocks to a specific text
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

// Helper function to escape special characters in a string for use in a regular expression
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

  return applySearchReplaceBlocks(originalText, blocks);
}
