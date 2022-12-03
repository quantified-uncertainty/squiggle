import { run } from "../../src/index";
import { blue, bold, green, red } from "../../src/cli/colors";

const testRun = (x: string) => {
  const { result } = run(x, {
    environment: { sampleCount: 100, xyPointLength: 100 },
  });
  if (result.ok) {
    return result.value;
  } else {
    throw Error(
      "Expected squiggle expression to evaluate but got error: " +
        result.value.toString()
    );
  }
};

export function test(name: string, fn: () => void) {
  console.log(bold(name));
  fn();
}

export function expectEqual(expression1: string, expression2: string) {
  let result1 = testRun(expression1);
  let result2 = testRun(expression2);
  if (result1.tag === "Number" && result2.tag === "Number") {
    let logloss = Math.log(Math.abs(result1.value - result2.value));
    let isBadLogless = logloss > 1;
    console.log(blue(`${expression1} = ${expression2}`));
    console.log(`${result1.value} = ${result2.value}`);
    console.log(
      `logloss = ${
        isBadLogless ? red(logloss.toFixed(2)) : green(logloss.toFixed(2))
      }`
    );
    console.log();
  } else {
    throw Error(
      `Expected both to be number, but got ${result1.tag} and ${result2.tag}`
    );
  }
}
