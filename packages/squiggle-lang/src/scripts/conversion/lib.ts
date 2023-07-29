import { run } from "../../index.js";
import { blue, bold, green, red } from "../../cli/colors.js";

const testRun = async (x: string) => {
  const outputR = await run(x, {
    environment: { sampleCount: 100, xyPointLength: 100 },
  });
  if (outputR.ok) {
    return outputR.value.result;
  } else {
    throw Error(
      "Expected squiggle expression to evaluate but got error: " +
        outputR.value.toString()
    );
  }
};

export function test(name: string, fn: () => void) {
  console.log(bold(name));
  fn();
}

export async function expectEqual(expression1: string, expression2: string) {
  const result1 = await testRun(expression1);
  const result2 = await testRun(expression2);
  if (result1.tag === "Number" && result2.tag === "Number") {
    const logloss = Math.log(Math.abs(result1.value - result2.value));
    const isBadLogless = logloss > 1;
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
