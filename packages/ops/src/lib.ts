import { exec as originalExec, spawn } from "node:child_process";
import fs from "node:fs/promises";
import util from "node:util";

// This function runs the command and returns `{ stdout, stderr }`.
export async function execWithCapture(command: string) {
  const exec = util.promisify(originalExec);
  return await exec(command);
}

// This function prints its stdout and stderr to terminal.
export async function exec(command: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(command, [], { shell: true, stdio: "inherit" });
    process.on("close", (code) => {
      if (code) {
        reject(`${command} failed\nError ${code}`);
      } else {
        resolve();
      }
    });
  });
}

export async function exists(f: string): Promise<boolean> {
  let exists = true;
  await fs.stat(f).catch((err) => {
    if (err.code === "ENOENT") exists = false;
  });
  return exists;
}
