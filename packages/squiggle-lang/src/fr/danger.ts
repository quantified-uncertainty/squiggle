/* Notes: See commit 5ce0a6979d9f95d77e4ddbdffc40009de73821e3 for last commit which has more detailed helper functions. These might be useful when coming back to this code after a long time. */

import { factorial } from "jstat";

import { FRFunction } from "../library/registry/core";
import { makeDefinition } from "../library/registry/fnDefinition";
import { frArray, frLambda, frNumber } from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { ReducerContext } from "../reducer/Context";
import { ErrorMessage, REOther } from "../reducer/ErrorMessage";
import { Lambda } from "../reducer/lambda";
import * as E_A from "../utility/E_A";
import { Ok, result } from "../utility/result";
import { ReducerFn, Value, vArray, vNumber } from "../value";

const maker = new FnFactory({
  nameSpace: "Danger",
  requiresNamespace: true,
});

const choose = (n: number, k: number) =>
  factorial(n) / (factorial(n - k) * factorial(k));

const combinatoricsLibrary: FRFunction[] = [
  maker.nn2n({
    name: "laplace",
    examples: [`Danger.laplace(1, 20)`],
    fn: (successes, trials) => (successes + 1) / (trials + 2),
  }),
  maker.n2n({
    name: "factorial",
    examples: [`Danger.factorial(20)`],
    fn: factorial,
  }),
  maker.nn2n({
    name: "choose",
    examples: [`Danger.choose(1, 20)`],
    fn: choose,
  }),
  maker.make({
    name: "binomial",
    output: "Number",
    examples: [`Danger.binomial(1, 20, 0.5)`],
    definitions: [
      makeDefinition("binomial", [frNumber, frNumber, frNumber], ([n, k, p]) =>
        Ok(vNumber(choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)))
      ),
    ],
  }),
];

const integrateFunctionBetweenWithNumIntegrationPoints = (
  lambda: Lambda,
  min: number,
  max: number,
  numIntegrationPoints: number,
  context: ReducerContext,
  reducer: ReducerFn
): result<Value, ErrorMessage> => {
  const applyFunctionAtFloatToFloatOption = (point: number) => {
    // Defined here so that it has access to context, reducer
    const result = lambda.call([vNumber(point)], context, reducer);
    if (result.type === "Number") {
      return result.value;
    }
    return ErrorMessage.throw(
      REOther(
        "Error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"
      )
    );
  };

  // Variables are punctiliously defined because it's otherwise easy to make off-by one errors.
  const numTotalPoints = numIntegrationPoints | 0; // superflous declaration, but useful to keep track that we are interpreting "numIntegrationPoints" as the total number on which we evaluate the function, not e.g., as the inner integration points.
  const numInnerPoints = numTotalPoints - 2;
  const numOuterPoints = 2;
  const totalWeight = max - min;
  const weightForAnInnerPoint = totalWeight / (numTotalPoints - 1);
  const weightForAnOuterPoint = totalWeight / (numTotalPoints - 1) / 2;
  const innerPointIncrement = (max - min) / (numTotalPoints - 1);
  const innerXs = E_A.makeBy(
    numInnerPoints,
    (i) => min + (i + 1) * innerPointIncrement
  );
  // Gotcha: makeBy goes from 0 to (n-1): <https://rescript-lang.org/docs/manual/latest/api/belt/array#makeby>
  let ys = innerXs.map((x) => applyFunctionAtFloatToFloatOption(x));

  /* Logging, with a worked example. */
  // Useful for understanding what is happening.
  // assuming min = 0, max = 10, numTotalPoints=10, results below:
  let verbose = false;
  if (verbose) {
    console.log("numTotalPoints", numTotalPoints); // 5
    console.log("numInnerPoints", numInnerPoints); // 3
    console.log("numOuterPoints", numOuterPoints); // always 2
    console.log("totalWeight", totalWeight); // 10 - 0 = 10
    console.log("weightForAnInnerPoint", weightForAnInnerPoint); // 10/4 = 2.5
    console.log("weightForAnOuterPoint", weightForAnOuterPoint); // 10/4/2 = 1.25
    console.log(
      "weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints",
      weightForAnInnerPoint * numInnerPoints +
        weightForAnOuterPoint * numOuterPoints
    ); // should be 10
    console.log(
      "sum of weights == totalWeight",
      weightForAnInnerPoint * numInnerPoints +
        weightForAnOuterPoint * numOuterPoints ===
        totalWeight
    ); // true
    console.log("innerPointIncrement", innerPointIncrement); // (10-0)/4 = 2.5
    console.log("innerXs", innerXs); // 2.5, 5, 7.5
    console.log("ys", ys);
  }

  const innerPointsSum = ys.reduce((a, b) => a + b, 0);
  const yMin = applyFunctionAtFloatToFloatOption(min);
  const yMax = applyFunctionAtFloatToFloatOption(max);
  const result =
    (yMin + yMax) * weightForAnOuterPoint +
    innerPointsSum * weightForAnInnerPoint;
  return Ok(vNumber(result));
};
const integrationLibrary: FRFunction[] = [
  // Integral in terms of function, min, max, num points
  // Note that execution time will be more predictable, because it
  // will only depend on num points and the complexity of the function
  maker.make({
    name: "integrateFunctionBetweenWithNumIntegrationPoints",
    requiresNamespace: false,
    output: "Number",
    examples: [
      `Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)`,
    ],
    // For the example of integrating x => x+1 between 1 and 10,
    // result should be close to 58.5
    // [x^2/2 + x]1_10 = (100/2 + 10) - (1/2 + 1) = 60 - 1.5 = 58.5
    // https://www.wolframalpha.com/input?i=integrate+x%2B1+from+1+to+10
    definitions: [
      makeDefinition(
        "integrateFunctionBetweenWithNumIntegrationPoints",
        [frLambda, frNumber, frNumber, frNumber],
        ([lambda, min, max, numIntegrationPoints], context, reducer) => {
          if (numIntegrationPoints === 0) {
            return ErrorMessage.throw(
              REOther(
                "Integration error 4 in Danger.integrate: Increment can't be 0."
              )
            );
          }
          return integrateFunctionBetweenWithNumIntegrationPoints(
            lambda,
            min,
            max,
            numIntegrationPoints,
            context,
            reducer
          );
        }
      ),
    ],
  }),
  // Integral in terms of function, min, max, epsilon (distance between points)
  // Execution time will be less predictable, because it
  // will depend on min, max and epsilon together,
  // as well and the complexity of the function
  maker.make({
    name: "integrateFunctionBetweenWithEpsilon",
    requiresNamespace: false,
    output: "Number",
    examples: [
      `Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)`,
    ],
    definitions: [
      makeDefinition(
        "integrateFunctionBetweenWithEpsilon",
        [frLambda, frNumber, frNumber, frNumber],
        ([lambda, min, max, epsilon], context, reducer) => {
          if (epsilon === 0) {
            return ErrorMessage.throw(
              REOther(
                "Integration error in Danger.integrate: Increment can't be 0."
              )
            );
          }
          return integrateFunctionBetweenWithNumIntegrationPoints(
            lambda,
            min,
            max,
            (max - min) / epsilon,
            context,
            reducer
          );
        }
      ),
    ],
  }),
];

const findBiggestElementIndex = (xs: number[]) =>
  xs.reduce((acc, newElement, index) => {
    if (newElement > xs[acc]) {
      return index;
    } else {
      return acc;
    }
  }, 0);

const diminishingReturnsLibrary = [
  maker.make({
    name: "optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
    output: "Array",
    requiresNamespace: false,
    examples: [
      `Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions([{|x| x+1}, {|y| 10}], 100, 0.01)`,
    ],
    definitions: [
      makeDefinition(
        "optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
        [frArray(frLambda), frNumber, frNumber],
        ([lambdas, funds, approximateIncrement], context, reducer) => {
          // TODO: This is so complicated, it probably should be its own file. It might also make sense to have it work in Rescript directly, taking in a function rather than a reducer; then something else can wrap that function in the reducer/lambdas/context.
          /*
    The key idea for this function is that
    1. we keep track of past spending and current marginal returns for each function
    2. we look an additional increment in funds
    3. we assign it to the function with the best marginal returns
    4. we update the spending, and we compute the new returns for that function, with more spending
      - But we only compute the new marginal returns for the function we end up assigning the spending to.
    5. We continue doing this until all the funding is exhausted
    This is currently being done with a reducer, that keeps track of:
      - Value of marginal spending for each function
      - How much has been assigned to each function.
 */

          /*
      Two possible algorithms (n=funds/increment, m=num lambdas)
      1. O(n): Iterate through value on next n dollars. At each step, only compute the new marginal return of the function which is spent. (This is what we are doing.)
      2. O(n*(m-1)): Iterate through all possible spending combinations. The advantage of this option is that it wouldn't assume that the returns of marginal spending are diminishing.
 */
          if (lambdas.length <= 1) {
            return ErrorMessage.throw(
              REOther(
                "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, number of functions should be greater than 1."
              )
            );
          }
          if (funds <= 0) {
            return ErrorMessage.throw(
              REOther(
                "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, funds should be greater than 0."
              )
            );
          }
          if (approximateIncrement <= 0) {
            return ErrorMessage.throw(
              REOther(
                "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be greater than 0."
              )
            );
          }
          if (approximateIncrement >= funds) {
            return ErrorMessage.throw(
              REOther(
                "Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be smaller than funds amount."
              )
            );
          }
          const applyFunctionAtPoint = (lambda: Lambda, point: number) => {
            // Defined here so that it has access to context, reducer
            const lambdaResult = lambda.call(
              [vNumber(point)],
              context,
              reducer
            );
            if (lambdaResult.type === "Number") {
              return lambdaResult.value;
            }
            return ErrorMessage.throw(
              REOther(
                "Error 1 in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"
              )
            );
          };

          const numDivisions = Math.round(funds / approximateIncrement);
          const increment = funds / numDivisions;
          const arrayOfIncrements = new Array(numDivisions).fill(increment);
          // ^ make the increment cleanly divide the amount of funds
          // nicely simplifies the calculations.

          type DiminishingReturnsAccumulator = {
            optimalAllocations: number[];
            currentMarginalReturns: number[];
          };

          const initAccumulator: DiminishingReturnsAccumulator = {
            optimalAllocations: new Array(lambdas.length).fill(0),
            currentMarginalReturns: lambdas.map((lambda) =>
              applyFunctionAtPoint(lambda, 0)
            ),
          };

          const optimalAllocationEndAccumulator = arrayOfIncrements.reduce(
            (acc, newIncrement) => {
              const oldMarginalReturns = acc.currentMarginalReturns;
              const indexOfBiggestDMR =
                findBiggestElementIndex(oldMarginalReturns);
              const newOptimalAllocations = [...acc.optimalAllocations];
              const newOptimalAllocationsi =
                newOptimalAllocations[indexOfBiggestDMR] + newIncrement;
              newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi;
              const lambdai = lambdas[indexOfBiggestDMR];
              const newMarginalResultsLambdai = applyFunctionAtPoint(
                lambdai,
                newOptimalAllocationsi
              );
              const newCurrentMarginalReturns = [...oldMarginalReturns];
              newCurrentMarginalReturns[indexOfBiggestDMR] =
                newMarginalResultsLambdai;

              const newAcc: DiminishingReturnsAccumulator = {
                optimalAllocations: newOptimalAllocations,
                currentMarginalReturns: newCurrentMarginalReturns,
              };
              return newAcc;
            },
            initAccumulator
          );

          return Ok(
            vArray(
              optimalAllocationEndAccumulator.optimalAllocations.map(vNumber)
            )
          );
        }
      ),
    ],
  }),
];

export const library = [
  // Combinatorics
  ...combinatoricsLibrary,

  //   // Integration
  ...integrationLibrary,

  // Diminishing marginal return functions
  ...diminishingReturnsLibrary,
];
