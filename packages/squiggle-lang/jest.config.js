/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist",
    "/__tests__/fixtures",
    "/__tests__/helpers",
    ".*_type_test.ts",
  ],
};
