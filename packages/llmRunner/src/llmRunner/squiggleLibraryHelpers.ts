import { libraryContents } from "./squiggleLibraryContents";

export { libraryContents };

export const librariesToImport = ["ozziegooen/sTest", "ozziegooen/helpers"];

export function getLibraryBySourceName(sourceName: string): string {
  const content = libraryContents.get(sourceName);
  if (content !== undefined) {
    if (content === null) {
      throw new Error(`Failed to load source ${sourceName}`);
    }
    return content;
  }
  throw new Error(`Source ${sourceName} not found`);
}
