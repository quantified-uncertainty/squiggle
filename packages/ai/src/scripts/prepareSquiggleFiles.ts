import axios from "axios";
import fs from "fs/promises";
import path, { dirname } from "path";
import prettier from "prettier";
import { fileURLToPath } from "url";

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

function getLibraryPath(libName: string): string {
  const [author, name] = libName.split("/");
  return path.join(
    "squiggleLibraries",
    author || "ozziegooen",
    `${name || libName}.squiggle`
  );
}

function getScriptPath() {
  const __filename = fileURLToPath(import.meta.url);
  return dirname(__filename);
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

async function saveToTsFile(
  contents: string,
  variableName: string,
  fileName: string
) {
  const fileContent = `// This file is auto-generated. Do not edit manually.
export const ${variableName} = ${contents};
`;

  const prettierConfig = await prettier.resolveConfig(process.cwd());
  const formattedContent = await prettier.format(fileContent, {
    ...prettierConfig,
    parser: "typescript",
  });

  const outputPath = path.join(getScriptPath(), "..", fileName);
  await fs.writeFile(outputPath, formattedContent);
  console.log(`${fileName} has been generated and formatted successfully.`);
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

  await saveToTsFile(
    `new Map([${contents.filter(Boolean).join(",\n")}]);`,
    "LIBRARY_CONTENTS",
    "squiggle/squiggleLibraryContents.ts"
  );
}

function getDocsPath(): string {
  return path.join(getScriptPath(), "..", "..", "files", "squiggleDocs.md");
}

async function generateReadme() {
  const docsPath = getDocsPath();
  const readmeContent = await fs.readFile(docsPath, "utf8");

  await saveToTsFile(
    `${JSON.stringify(readmeContent)}`,
    "README",
    "squiggle/README.ts"
  );
}

// We save the files into TS files, so that Vercel could read them.
async function main() {
  await fetchAllLibraries();
  await generateLibraryContents();
  await generateReadme();
}

main().catch((error) => {
  console.error("Error in main process:", error);
  process.exit(1);
});
