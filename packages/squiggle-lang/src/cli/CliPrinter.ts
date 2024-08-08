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
}
