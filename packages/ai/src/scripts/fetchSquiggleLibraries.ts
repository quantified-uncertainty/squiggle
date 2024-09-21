import axios from "axios";
import fs from "fs/promises";
import path from "path";

export const librariesToImport = ["ozziegooen/sTest", "ozziegooen/helpers"];

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

export function getLibraryPath(libName: string): string {
  const [author, name] = libName.split("/");
  return path.join(
    "squiggleLibraries",
    author || "ozziegooen",
    `${name || libName}.squiggle`
  );
}

async function fetchSquiggleCode(owner: string, slug: string) {
  try {
    const query = getQuery(owner, slug);
    const response = await axios.post(GRAPHQL_URL, { query });
    const code = response.data.data.model.currentRevision.content.code;

    const filePath = getLibraryPath(`${owner}/${slug}`);
    const dirPath = path.dirname(filePath);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, code, "utf-8");

    console.log(`Squiggle code has been saved to ${filePath}`);
  } catch (error) {
    console.error("Error fetching or saving Squiggle code:", error);
  }
}

// Fetch all libraries
async function fetchAllLibraries() {
  for (const lib of librariesToImport) {
    const [owner, slug] = lib.split("/");
    await fetchSquiggleCode(owner, slug);
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
// New function to generate squiggleLibraryContents.ts.
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

// Run the fetching process and generate LibraryContents.ts
async function main() {
  await fetchAllLibraries();
  await generateLibraryContents();
}

main().catch((error) => {
  console.error("Error in main process:", error);
  process.exit(1);
});
