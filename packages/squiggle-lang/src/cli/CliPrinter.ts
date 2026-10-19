import { bold, red, yellow } from "./colors.js";

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
  printError(header: string, details: string, color = red) {
    if (!this.isFirstSection) {
      console.error();
    }
    this.isFirstSection = false;
    console.error(color(bold(header + ":")));
    console.error(details);
  }

  printWarning(header: string, details: string) {
    this.printError(header, details, yellow);
  }
}
