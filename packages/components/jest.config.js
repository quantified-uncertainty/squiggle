/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^d3$": "<rootDir>/../../node_modules/d3/dist/d3.min.js",
    "^d3-(.*)$": `<rootDir>/../../node_modules/d3-$1/dist/d3-$1`,
  },
};
