/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testTimeout: 60000, // github actions can be slow
  maxWorkers: 1, // equivalent to --runInBand
};

export default config;
