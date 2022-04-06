/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [
    "<rootdir>/../../node_modules/bisect_ppx/src/runtime/js/jest.bs.js"
  ],
};
