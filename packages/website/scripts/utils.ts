import fs from "fs";

export function readFile(fileName: string) {
  return fs.readFileSync(fileName, "utf-8");
}

export function writeFile(fileName: string, content: string) {
  fs.writeFile(fileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${fileName}`);
  });
}
