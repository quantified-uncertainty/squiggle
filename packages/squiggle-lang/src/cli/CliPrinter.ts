import { bold, red } from "./colors.js";

export class CliPrinter {
  isFirstSection = true;

  // Prints a section consisting of multiple lines; prints an extra "\n" if a section was printed before.
  printSection(...lines: string[]) {
    if (!this.isFirstSection) {
      console.log();
    }
    this.isFirstSection = false;
    lines.forEach((line) => console.log(line));
  }

  // Prints an error section to stderr with a colored header.
  printError(header: string, details: string) {
    if (!this.isFirstSection) {
      console.error();
    }
    this.isFirstSection = false;
    console.error(red(bold(header + ":")));
    console.error(details);
  }
}
