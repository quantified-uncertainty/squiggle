/**
 * Terminal-based script to collect Fermi contest submissions
 * Interactively gathers entries and saves them to the submissions.json file
 */

import { confirm, editor, input } from "@inquirer/prompts";
import fs from "fs";
import path from "path";

import { Submission } from "./types";

// Function to load existing submissions
async function loadSubmissions(): Promise<Submission[]> {
  const submissionsPath = path.join(__dirname, "../data/submissions.json");

  // Create data directory if it doesn't exist
  const dataDir = path.join(__dirname, "../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("Created data directory");
    return [];
  }

  // Return empty array if file doesn't exist
  if (!fs.existsSync(submissionsPath)) {
    return [];
  }

  // Read and parse the file
  try {
    const data = await fs.promises.readFile(submissionsPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading submissions file:", error);
    return [];
  }
}

// Function to save submissions to file
async function saveSubmissions(submissions: Submission[]): Promise<void> {
  const submissionsPath = path.join(__dirname, "../data/submissions.json");

  try {
    await fs.promises.writeFile(
      submissionsPath,
      JSON.stringify(submissions, null, 2)
    );
    console.log(
      `Saved ${submissions.length} submissions to ${submissionsPath}`
    );
  } catch (error) {
    console.error("Error saving submissions:", error);
    throw error;
  }
}

// Function to collect a new submission via terminal input
async function collectSubmission(): Promise<Submission> {
  console.log("\n=== New Fermi Model Contest Submission ===");

  const author = await input({ message: "Author name:" });

  // Collect multi-line model input
  const model = await editor({ message: "Fermi model:" });

  // Generate unique ID based on author name and timestamp
  const id = `submission-${author.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  return {
    id,
    author,
    text: model,
  };
}

// Main function to run the submission collection
async function main() {
  console.log("Fermi Model Contest - Submission Collection Tool");
  console.log("==============================================");

  // Load existing submissions
  const submissions = await loadSubmissions();
  console.log(`Loaded ${submissions.length} existing submissions`);

  let collecting = true;

  while (collecting) {
    // Collect a new submission
    const submission = await collectSubmission();
    submissions.push(submission);

    // Save after each submission
    await saveSubmissions(submissions);

    // Ask if user wants to add another submission
    const another = await confirm({
      message: "Add another submission?",
    });
    collecting = another;
  }

  console.log("\nThank you for using the Fermi Contest submission tool!");
}

// Run the program
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
