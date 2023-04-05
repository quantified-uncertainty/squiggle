/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  preset: "ts-jest/presets/default-esm-legacy",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.[jt]sx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/",
    "<rootDir>/dist",
    "<rootDir>/__tests__/fixtures",
    "<rootDir>/__tests__/helpers",
    ".*_type_test.ts",
  ],
};

export default jestConfig;
