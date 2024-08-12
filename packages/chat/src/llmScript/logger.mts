import boxen from "boxen";
// logger.ts
import chalk from "chalk";

export class Logger {
  static log(message: string) {
    console.log(message);
  }

  static info(message: string) {
    console.log(chalk.blue(message));
  }

  static success(message: string) {
    console.log(chalk.green(`✅ ${message}`));
  }

  static error(message: string) {
    console.error(chalk.red(`❌ ${message}`));
  }

  static warn(message: string) {
    console.log(chalk.yellow(`⚠️ ${message}`));
  }

  static highlight(message: string) {
    console.log(chalk.cyan(message));
  }

  static code(code: string, title: string) {
    console.log(chalk.yellow(title));
    console.log(chalk.green(code));
  }

  static errorBox(message: string) {
    console.log(boxen(chalk.red(message), { padding: 1, borderColor: "red" }));
  }

  static summary(trackingInfo: any) {
    console.log(chalk.blue.bold("\n📊 Summary:"));
    console.log(
      `Total time spent creating Squiggle code: ${trackingInfo.time.createSquiggleCode.toFixed(2)} seconds`
    );
    console.log(
      `Total time spent validating and fixing code: ${trackingInfo.time.validateAndFixCode.toFixed(2)} seconds`
    );
    console.log(`Total input tokens: ${trackingInfo.tokens.input}`);
    console.log(`Total output tokens: ${trackingInfo.tokens.output}`);
  }
}
