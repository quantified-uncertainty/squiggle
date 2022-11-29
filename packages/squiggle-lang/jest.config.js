/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    "fixtures.ts",
    "/node_modules/",
    ".*Helpers.ts",
    ".*Reducer_Type.*",
    ".*_type_test.ts",
    "/dist",
  ],
};
