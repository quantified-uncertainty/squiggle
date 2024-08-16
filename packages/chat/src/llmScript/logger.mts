import boxen from "boxen";
import chalk from "chalk";
import fs from "fs";
import path from "path";

import { calculatePrice, type Message, SELECTED_MODEL } from "./llmConfig.mjs";

export class Logger {
  private static logDir = path.join(process.cwd(), "logs");
  private static currentLogFile: string;

  static initNewLog() {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    this.currentLogFile = path.join(
      this.logDir,
      `squiggle_generator_${timestamp}.log`
    );

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.writeToFile("INFO", "New log session started");
  }

  private static writeToFile(level: string, message: string) {
    if (!this.currentLogFile) {
      this.initNewLog();
    }
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}]:\n${this.stripAnsi(message)}\n\n`;
    fs.appendFileSync(this.currentLogFile, logMessage);
  }

  private static stripAnsi(message: string): string {
    return message.replace(/\x1b\[[0-9;]*m/g, "");
  }

  static log(message: string) {
    console.log(message);
    this.writeToFile("LOG", message);
  }

  static info(message: string) {
    console.log(chalk.blue(message));
    this.writeToFile("INFO", message);
  }

  static logConversationHistory(history: Message[]) {
    // console.log(chalk.cyan("Conversation History:"));
    history.forEach((message, index) => {
      // console.log(
      //   chalk.yellow(`\n--- Message ${index + 1} (${message.role}) ---`)
      // );
      // console.log(message.content);
      this.writeToFile(
        "CONVERSATION_HISTORY",
        `Message ${index + 1} (${message.role}):\n${message.content}`
      );
    });
  }

  static success(message: string) {
    console.log(chalk.green(`✅ ${message}`));
    this.writeToFile("SUCCESS", message);
  }

  static error(message: string) {
    console.error(chalk.red(`❌ ${message}`));
    this.writeToFile("ERROR", message);
  }

  static warn(message: string) {
    console.log(chalk.yellow(`⚠️ ${message}`));
    this.writeToFile("WARNING", message);
  }

  static highlight(message: string) {
    console.log(chalk.cyan(message));
    this.writeToFile("HIGHLIGHT", message);
  }

  static code(code: string, title: string) {
    console.log(chalk.yellow(title));
    console.log(chalk.green(code));
    this.writeToFile("CODE", `${title}\n${code}`);
  }

  static errorBox(message: string) {
    console.log(boxen(chalk.red(message), { padding: 1, borderColor: "red" }));
    this.writeToFile("ERROR_BOX", message);
  }

  static summary(trackingInfo: any) {
    console.log(chalk.blue.bold("\n📊 Summary:"));
    this.writeToFile("SUMMARY", "Summary:");

    // Calculate the price
    const estimatedCost = calculatePrice(
      trackingInfo.tokens.input,
      trackingInfo.tokens.output
    );

    const details = [
      `Total time spent creating Squiggle code: ${trackingInfo.time.createSquiggleCode.toFixed(2) / 1000} seconds`,
      `Total time spent validating and fixing code: ${trackingInfo.time.validateAndFixCode.toFixed(2) / 1000} seconds`,
      `Total input tokens: ${trackingInfo.tokens.input}`,
      `Total output tokens: ${trackingInfo.tokens.output}`,
      `Estimated cost: $${estimatedCost.toFixed(6)} (${SELECTED_MODEL})`,
    ];

    details.forEach((detail) => {
      console.log(detail);
      this.writeToFile("SUMMARY", detail);
    });
  }

  static debug(message: string) {
    this.writeToFile("DEBUG", message);
  }

  static logPrompt(prompt: string) {
    this.writeToFile("PROMPT", `Full Prompt:\n${prompt}`);
  }

  static logLLMResponse(response: string, duration: number) {
    console.log(`Response finished in ${duration / 1000}s.`);
    this.writeToFile(
      "LLM_RESPONSE",
      `LLM Response after ${duration / 1000}s:\n${response}`
    );
  }
}
