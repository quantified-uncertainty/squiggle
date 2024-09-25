export function addLineNumbers(code: string): string {
  return code
    .split("\n")
    .map((line, index) => `${(index + 1).toString().padStart(3, "0")}||${line}`)
    .join("\n");
}
