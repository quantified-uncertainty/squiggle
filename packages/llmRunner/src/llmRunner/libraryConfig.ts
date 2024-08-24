import * as fs from "fs";
import * as path from "path";

export const librariesToImport = ["ozziegooen/sTest", "ozziegooen/helpers"];

export function getLibraryPath(libName: string): string {
  const [author, name] = libName.split("/");
  return path.join(
    "squiggleLibraries",
    author || "ozziegooen",
    `${name || libName}.squiggle`
  );
}

export const libraryContents = new Map(
  librariesToImport.map((lib) => {
    const filePath = getLibraryPath(lib);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        return [`hub:${lib}`, content];
      } catch (error) {
        console.error(`Failed to load library ${lib}: ${error.message}`);
        return [`hub:${lib}`, null];
      }
    } else {
      console.log(`Library file not found for ${lib}. It will be fetched.`);
      return [`hub:${lib}`, null];
    }
  })
);

export function getLibraryContent(sourceName: string): string {
  const content = libraryContents.get(sourceName);
  if (content !== undefined) {
    if (content === null) {
      throw new Error(`Failed to load source ${sourceName}`);
    }
    return content;
  }
  throw new Error(`Source ${sourceName} not found`);
}
