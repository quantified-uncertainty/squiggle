import axios from "axios";
import fs from "fs/promises";
import path from "path";

export const librariesToImport = ["ozziegooen/sTest", "ozziegooen/helpers"];
export const examplesToImport = [
  "ozziegooen/virus-model",
  "ozziegooen/meeting-cost-calculator",
  "ozziegooen/laptop-battery-cost",
  "ozziegooen/shapley-values",
  "ozziegooen/AI-safety-company-factors",
  "ozziegooen/ev-agi-to-individuals",
  "ozziegooen/costs-of-computer-use",
  "ozziegooen/costs-of-sfo-to-uk-flight-claude",
  "ozziegooen/room-model",
  "ozziegooen/cost-of-reading-calculator",
  "ozziegooen/helpers",
  "ozziegooen/room-model",
  "ozziegooen/movies-2024-July-prediction-tournament",
  "blueprint-biosecurity/burden-of-resp-disease",
  "blueprint-biosecurity/endemic-covid-baseline",
  "blueprint-biosecurity/far-uvc-botec",
  "blueprint-biosecurity/DALY-x-risk-BOTEC",
  "SRS-Resilience/Volcanic-Cooling-Events-GeoMean-of-Odds-Approach",
  "mdickens/Uganda-Community-Farm-sorghum",
  "mlao-pdx/stringSort",
  "patbl/water-filtration-system-comparison",
];

const GRAPHQL_URL = "https://squigglehub.org/api/graphql";

function getQuery(owner: string, slug: string) {
  return `
  query MyQuery {
    model(input: {owner: "${owner}", slug: "${slug}"}) {
      ... on Model {
        id
        currentRevision {
          content {
            ... on SquiggleSnippet {
              id
              code
            }
          }
        }
      }
    }
  }
  `;
}

function getSquigglePath(itemName: string, baseDir: string): string {
  const [author, name] = itemName.split("/");
  return path.join(
    baseDir,
    author || "ozziegooen",
    `${name || itemName}.squiggle`
  );
}

export function getLibraryPath(libName: string): string {
  return getSquigglePath(libName, "squiggleLibraries");
}

export function getExamplePath(exampleName: string): string {
  return getSquigglePath(exampleName, "squiggleExamples");
}

async function fetchSquiggleCode(owner: string, slug: string, baseDir: string) {
  try {
    const query = getQuery(owner, slug);
    const response = await axios.post(GRAPHQL_URL, { query });
    const code = response.data.data.model.currentRevision.content.code;

    const filePath = getSquigglePath(`${owner}/${slug}`, baseDir);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, code, "utf-8");

    console.log(`Squiggle file has been saved to ${filePath}`);
  } catch (error) {
    console.error(`Error fetching or saving Squiggle file:`, error);
  }
}

// Fetch all libraries and examples
async function fetchAllLibrariesAndExamples() {
  for (const lib of librariesToImport) {
    const [owner, slug] = lib.split("/");
    await fetchSquiggleCode(owner, slug, "squiggleLibraries");
  }

  for (const example of examplesToImport) {
    const [owner, slug] = example.split("/");
    await fetchSquiggleCode(owner, slug, "squiggleExamples");
  }
}

// We save the files into a TS file, so that Vercel could read them.
async function saveToTsFile(contents: (string | null)[], fileName: string) {
  const fileContent = `// This file is auto-generated. Do not edit manually.
export const squiggleLibraryContents = new Map([
${contents.filter(Boolean).join(",\n")}
]);
`;

  const outputPath = path.join(__dirname, "..", fileName);
  await fs.writeFile(outputPath, fileContent);
  console.log(`${fileName} has been generated successfully.`);
}

async function generateLibraryContents() {
  const contents = await Promise.all(
    librariesToImport.map(async (lib) => {
      const filePath = getLibraryPath(lib);
      try {
        const content = await fs.readFile(filePath, "utf8");
        return `  ['hub:${lib}', ${JSON.stringify(content)}]`;
      } catch (error) {
        console.warn(`Warning: Library file not found for ${lib}.`);
        return null;
      }
    })
  );

  await saveToTsFile(contents, "squiggleLibraryContents.ts");
}

async function generateExampleContents() {
  const contents = await Promise.all(
    examplesToImport.map(async (example) => {
      const filePath = getExamplePath(example);
      try {
        const content = await fs.readFile(filePath, "utf8");
        return `  ['hub:${example}', ${JSON.stringify(content)}]`;
      } catch (error) {
        console.warn(`Warning: Example file not found for ${example}.`);
        return null;
      }
    })
  );

  await saveToTsFile(contents, "squiggleExampleContents.ts");
}

async function main() {
  await fetchAllLibrariesAndExamples();
  await generateLibraryContents();
  await generateExampleContents();
}

main().catch((error) => {
  console.error("Error in main process:", error);
  process.exit(1);
});
