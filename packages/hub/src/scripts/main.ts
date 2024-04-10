// buildRecentModelRevision.ts
import { spawn } from "child_process";

async function runWorker() {
  return new Promise((resolve, reject) => {
    const worker = spawn("tsx", ["src/scripts/buildRecentModelRevision.ts"]);

    let workerOutput = "";

    const timeoutId = setTimeout(() => {
      worker.kill();
      reject(new Error("Worker process timed out"));
    }, 6000); // 10 seconds

    worker.stdout.on("data", (data) => {
      workerOutput += console.log(`Worker output: ${data}`);
    });

    worker.stderr.on("data", (data) => {
      console.error(`Worker error: ${data}`);
    });

    worker.on("exit", (code) => {
      clearTimeout(timeoutId);
      if (code === 0) {
        console.log("Worker output:", workerOutput);
        console.log("Worker completed successfully");
        resolve(2);
      } else {
        console.error(`Worker process exited with code ${code}`);
        reject(new Error(`Worker process exited with code ${code}`));
      }
    });
  });
}

async function main() {
  try {
    await runWorker();
    console.log("Main process completed successfully");
  } catch (error) {
    console.error("Worker process encountered an error:", error);
  } finally {
    console.log("Main process completed");

    console.log("Memory usage:", process.memoryUsage());

    // Other process-related information
    console.log("Process ID:", process.pid);
    console.log("Process uptime:", process.uptime());
    console.log("Process platform:", process.platform);
    console.log("Process architecture:", process.arch);
    console.log("Node.js version:", process.version);
  }
}

main();
