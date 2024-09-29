import * as fs from "fs";

import { examplesToImport } from "./fine-tuning/favoriteExamples.js";
import {
  fetchCodeFromGraphQL,
  fetchGroupModels,
} from "./squiggleHubHelpers.js";

interface ProcessedModel {
  prompt: string;
  response: string;
}

function processModel(code: string): ProcessedModel {
  const lines = code.split("\n");
  const firstLine = lines[0].trim();

  let prompt = "";
  let response = "";

  if (firstLine.startsWith("//") || firstLine.startsWith("// ")) {
    prompt = firstLine.replace(/^\/\/\s?/, "");
    response = lines.slice(1).join("\n").trim();
  } else {
    console.warn(
      "Model does not start with a comment. Using entire code as response."
    );
    response = code.trim();
  }

  return { prompt, response };
}

async function fetchAndProcessGroupModels(
  groupSlug: string
): Promise<ProcessedModel[]> {
  const rawModels = await fetchGroupModels(groupSlug);
  return rawModels.map(processModel);
}

async function saveModelsToJSON(
  models: ProcessedModel[],
  outputPath: string
): Promise<void> {
  try {
    const jsonData = models.map((code, index) => ({
      prompt: code.prompt,
      code: code.response,
    }));

    const jsonString = JSON.stringify(jsonData, null, 2);
    await fs.promises.writeFile(outputPath, jsonString, "utf-8");
    console.log(`Successfully saved ${models.length} models to ${outputPath}`);
  } catch (error) {
    console.error("Error saving models to JSON:", error);
    throw error;
  }
}

function formatModelsForFineTuning(models: ProcessedModel[]): string {
  const formattedData = models.map((model) => ({
    messages: [
      {
        role: "system",
        content:
          "You are an AI assistant that helps with Squiggle programming.",
      },
      {
        role: "user",
        content: model.prompt,
      },
      {
        role: "assistant",
        content: `\`\`\`squiggle\n${model.response}\n\`\`\``,
      },
    ],
  }));

  return formattedData.map((data) => JSON.stringify(data)).join("\n");
}

async function saveFormattedModelsToFile(
  formattedData: string,
  outputPath: string
): Promise<void> {
  try {
    await fs.promises.writeFile(outputPath, formattedData, "utf-8");
    console.log(`Successfully saved formatted models to ${outputPath}`);
  } catch (error) {
    console.error("Error saving formatted models to file:", error);
    throw error;
  }
}

async function processFavoriteExamples(): Promise<ProcessedModel[]> {
  const processedExamples: ProcessedModel[] = [];

  for (const example of examplesToImport) {
    const [owner, slug] = example.id.split("/");
    try {
      const code = await fetchCodeFromGraphQL(owner, slug);
      processedExamples.push({
        prompt: example.prompt,
        response: code.trim(),
      });
    } catch (error) {
      console.error(`Error processing example ${example.id}:`, error);
    }
  }

  return processedExamples;
}

async function main() {
  const groupSlug = "ai-generated-examples";
  const outputPath = "ai-models.json";
  const combinedOutputPath = "fine-tuning-models.jsonl";

  try {
    // Process AI-generated examples
    console.log(`Fetching models from group: ${groupSlug}`);
    const aiModels = await fetchAndProcessGroupModels(groupSlug);

    console.log(
      `Saving ${aiModels.length} AI models to JSON file: ${outputPath}`
    );
    await saveModelsToJSON(aiModels, outputPath);

    // Process favorite examples
    console.log(`Processing favorite examples`);
    const favoriteExamples = await processFavoriteExamples();

    // Combine AI models and favorite examples
    const combinedModels = [...aiModels, ...favoriteExamples];

    console.log(`Formatting combined models for fine-tuning`);
    const formattedCombinedData = formatModelsForFineTuning(combinedModels);

    console.log(
      `Saving formatted combined models to file: ${combinedOutputPath}`
    );
    await saveFormattedModelsToFile(formattedCombinedData, combinedOutputPath);

    console.log(
      `Process completed successfully. Total models: ${combinedModels.length}`
    );
  } catch (error) {
    console.error("Error in main process:", error);
  }
}

// Run the main function
main();
