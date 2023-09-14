import nextJest from "next/jest.js";
import { TextEncoder, TextDecoder } from "util";

const createJestConfig = nextJest({
  // Next.js app path
  dir: "./",
});

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/test/setup-db.ts"],
  // https://stackoverflow.com/a/72320166
  globals: {
    TextDecoder,
    TextEncoder,
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
