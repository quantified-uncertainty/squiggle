/** @type {import('jest').Config} */
const jestConfig = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist"],
};

export default jestConfig;
