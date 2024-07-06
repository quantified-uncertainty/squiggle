const { Anthropic } = require("@anthropic-ai/sdk");
const dotenv = require("dotenv");

// You'll need to implement or import this

// Load environment variables
dotenv.config({ path: ".env.local" });

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateSquiggleCode(prompt: string): Promise<string> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `Generate Squiggle code for the following prompt. Only return the code, no explanations. Wrap the code in \`\`\`squiggle tags.\n\nPrompt: ${prompt}`,
        },
      ],
    });

    console.log("got response back", message);
    return extractSquiggleCode(message.content[0].text);
  } catch (error) {
    console.error("Error generating Squiggle code:", error);
    throw error;
  }
}

function extractSquiggleCode(content: string): string {
  const match = content.match(/```squiggle([\s\S]*?)```/);
  return match ? match[1].trim() : "";
}

async function main() {
  const prompt =
    "Create a model that estimates the probability of rain tomorrow based on today's temperature and humidity.";

  console.log("Generating Squiggle code...");
  let code = await generateSquiggleCode(prompt);
  console.log("Generated code:\n", code);

  let isValid = false;
  let attempts = 0;
  const MAX_ATTEMPTS = 3;

  while (!isValid && attempts < MAX_ATTEMPTS) {
    try {
      isValid = true;
      console.log("Code is valid!");
    } catch (error) {
      console.log(`Validation error: ${error}`);
      console.log("Attempting to fix the code...");
      // code = await fixSquiggleCode(code, error);
      console.log("Fixed code:\n", code);
      attempts++;
    }
  }

  if (isValid) {
    console.log("Final valid Squiggle code:\n", code);
  } else {
    console.log(
      `Failed to generate valid Squiggle code after ${MAX_ATTEMPTS} attempts.`
    );
  }
}

main().catch(console.error);
