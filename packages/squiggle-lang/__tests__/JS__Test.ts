import { run, exportToString } from '../src/js/index';

let testRun = (expression: string): string => exportToString(run(expression)[0])

let runTest = (expression: string, expected: string) => test(expression, () => expect(testRun(expression)).toEqual(expected))

let runErrorTest = (expression: string, expected: string) => test(`${expression} will error`, () => expect(() => testRun(expression)).toThrowError(expected))

describe("Simple calculations and results", () => {
    runTest("mean(normal(5,2))", "5")
    runTest("10 + 10", "20")
})

describe("Log function", () => {
    runTest("log(1)", "0")
})
