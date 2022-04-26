import { run, squiggleExpression, errorValueToString } from "../src/js/index";
import * as chalk from "chalk";

let testRun = (x: string): squiggleExpression => {
  let result = run(x, { sampleCount: 100, xyPointLength: 100 });
  if (result.tag === "Ok") {
    return result.value;
  } else {
    throw Error(
      "Expected squiggle expression to evaluate but got error: " +
        errorValueToString(result.value)
    );
  }
};

export function test(name: string, fn: () => void) {
  console.log(chalk.cyan.bold(name));
  fn();
}

export function expectEqual(expression1: string, expression2: string) {
  let result1 = testRun(expression1);
  let result2 = testRun(expression2);
  if (result1.tag === "number" && result2.tag === "number") {
    let logloss = Math.log(Math.abs(result1.value - result2.value));
    let isBadLogless = logloss > 1;
    console.log(chalk.blue(`${expression1} = ${expression2}`));
    console.log(`${result1.value} = ${result2.value}`);
    console.log(
      `logloss = ${
        isBadLogless
          ? chalk.red(logloss.toFixed(2))
          : chalk.green(logloss.toFixed(2))
      }`
    );
    console.log();
  } else {
    throw Error(
      `Expected both to be number, but got ${result1.tag} and ${result2.tag}`
    );
  }
}
