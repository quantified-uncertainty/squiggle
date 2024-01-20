/** @type {import('jest').Config} */
const jestConfig = {
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist"],
};

export default jestConfig;
