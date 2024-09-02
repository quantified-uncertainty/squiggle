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
      const content = fs.readFileSync(filePath, "utf8");
      return [`hub:${lib}`, content];
    } else {
      throw new Error(`Library file not found for ${lib}.`);
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
