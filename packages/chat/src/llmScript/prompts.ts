import { getSquiggleAdvice } from "./getSquiggleAdvice";

export const generateNewSquiggleCodePrompt = (prompt: string): string => {
  return `Generate Squiggle code for the following prompt. Produce only code, no explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}.\n\n`;
};

export const editExistingSquiggleCodePrompt = (
  existingCode: string,
  error: string
): string => {
  const advice = getSquiggleAdvice(error, existingCode);
  let content = `That code produced the following error. Write a full new model that fixes that error. ${error}\n\n`;

  if (advice) {
    content += `Advice: ${advice}\n\n`;
  }

  return content;
};

export const adjustToFeedbackPrompt = (bindings: any, result: any): string => {
  return `The previous Squiggle code produced this output:
Output:

variables: ${bindings}

result: ${result}

Analyze the code and its output. Do you think the code needs adjustment? If not, respond with exactly "NO_ADJUSTMENT_NEEDED". If yes, please provide the full adjusted code. Consider unexpected results, failing tests, or any improvements that could be made based on the output.`;
};
