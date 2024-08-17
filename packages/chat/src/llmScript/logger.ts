import boxen from "boxen";
import chalk from "chalk";
import crypto from "crypto";
import fs from "fs";
import path from "path";

import { calculatePrice, type Message, SELECTED_MODEL } from "./llmConfig";

export class Logger {
  private static logDir = path.join(process.cwd(), "logs");
  private logFile: string;

  constructor() {
    this.initNewLog();
  }

  private initNewLog() {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const randomString = crypto.randomBytes(4).toString("hex");
    this.logFile = path.join(
      Logger.logDir,
      `squiggle_generator_${timestamp}_${randomString}.log`
    );

    if (!fs.existsSync(Logger.logDir)) {
      fs.mkdirSync(Logger.logDir, { recursive: true });
    }

    this.writeToFile("INFO", "New log session started");
  }

  private writeToFile(level: string, message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${level}]:\n${this.stripAnsi(message)}\n\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  private stripAnsi(message: string): string {
    return message.replace(/\x1b\[[0-9;]*m/g, "");
  }

  log(message: string) {
    console.log(message);
    this.writeToFile("LOG", message);
  }

  info(message: string) {
    console.log(chalk.blue(message));
    this.writeToFile("INFO", message);
  }

  logConversationHistory(history: Message[]) {
    history.forEach((message, index) => {
      this.writeToFile(
        "CONVERSATION_HISTORY",
        `Message ${index + 1} (${message.role}):\n${message.content}`
      );
    });
  }

  success(message: string) {
    console.log(chalk.green(`✅ ${message}`));
    this.writeToFile("SUCCESS", message);
  }

  error(message: string) {
    console.error(chalk.red(`❌ ${message}`));
    this.writeToFile("ERROR", message);
  }

  warn(message: string) {
    console.log(chalk.yellow(`⚠️ ${message}`));
    this.writeToFile("WARNING", message);
  }

  highlight(message: string) {
    console.log(chalk.cyan(message));
    this.writeToFile("HIGHLIGHT", message);
  }

  code(code: string, title: string) {
    console.log(chalk.yellow(title));
    console.log(chalk.green(code));
    this.writeToFile("CODE", `${title}\n${code}`);
  }

  errorBox(message: string) {
    console.log(boxen(chalk.red(message), { padding: 1, borderColor: "red" }));
    this.writeToFile("ERROR_BOX", message);
  }

  summary(trackingInfo: any) {
    console.log(chalk.blue.bold("\n📊 Summary:"));
    this.writeToFile("SUMMARY", "Summary:");

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

  debug(message: string) {
    this.writeToFile("DEBUG", message);
  }

  logPrompt(prompt: string) {
    this.writeToFile("PROMPT", `Full Prompt:\n${prompt}`);
  }

  logLLMResponse(response: string, duration: number) {
    console.log(`Response finished in ${duration / 1000}s.`);
    this.writeToFile(
      "LLM_RESPONSE",
      `LLM Response after ${duration / 1000}s:\n${response}`
    );
  }
}
