import axios from "axios";
import fs from "fs/promises";
import path from "path";

import { getLibraryPath, librariesToImport } from "../libraryConfig";

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

// Run the fetching process
fetchAllLibraries();
