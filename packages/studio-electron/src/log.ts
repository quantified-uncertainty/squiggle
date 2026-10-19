import { app } from "electron";

// Logs to stdout in development, or when SQUIGGLE_STUDIO_DEBUG=1.
export function log(message: string): void {
  if (!app.isPackaged || process.env["SQUIGGLE_STUDIO_DEBUG"] === "1") {
    console.log(`[studio-electron] ${message}`);
  }
}
