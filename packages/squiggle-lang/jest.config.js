/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: [
    ".*Fixtures.bs.js",
    "/node_modules/",
    ".*Helpers.bs.js",
    ".*Helpers.ts",
    ".*Reducer_Type.*",
    ".*_type_test.bs.js",
    "/dist",
  ],
};
