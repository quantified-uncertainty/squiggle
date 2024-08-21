#!/usr/bin/env node
import {
  removeLambdas,
  result,
  simpleValueFromAny,
  SqError,
  SqLinker,
  SqProject,
  summarizeSimpleValueWithoutLambda,
} from "@quri/squiggle-lang";

import { formatSquiggleCode } from "./formatSquiggleCode";
import { CodeState } from "./stateManager";

const linker: SqLinker = {
  resolve: (name: string) => name,
  loadSource: async (sourceName: string) => {
    // Note how this function is async and can load sources remotely on demand.
    switch (sourceName) {
      case "hub:ozziegooen/sTest":
        return `
@startClosed
createExpectation(actual) = {
  toBe: {
    |expected|
    if actual != expected then "Expected " + expected + " but got " +
      actual else true
  },
  toBeGreaterThan: {
    |expected|
    if actual <= expected then "Expected " + actual + " to be greater than " +
      expected else true
  },
  toBeLessThan: {
    |expected|
    if actual >= expected then "Expected " + actual + " to be less than " +
      expected else true
  },
  toBeTrue: {|| if !actual then "Expected true but got " + actual else true},
  toBeFalse: {|| if actual then "Expected false but got " + actual else true},
}

runTest(test) = {
  fnResult = test.fn()
  {
    name: test.name,
    passed: fnResult == true,
    error: if fnResult != true then fnResult else "",
  }
}

@startClosed
generateTestReport(name, testResults) = {
  passedTests = List.filter(testResults, {|t| t.passed})
  failedTests = List.filter(testResults, {|t| !t.passed})

  [
    "## Test Suite: " + name + "  ",
    "**Total tests**: " + List.length(testResults) + "  ",
    "**Passed**: " + List.length(passedTests) + "  ",
    "**Failed**: " + List.length(failedTests),
    "",
    "**Results:**  ",
  ]
}

@startClosed
formatTestResult(testResult) = (if testResult.passed then "✅" else "❌") +
  "  " +
  testResult.name +
  (if testResult.error != "" then "
    --- Error: *" + testResult.error +
    "*" else "") +
  "  "

// Main squiggleJest framework
@startClosed
squiggleJest = {
  expect: createExpectation,
  test: {|name, fn| { name: name, fn: fn }},
  describe: {
    |name, tests|
    testResults = List.map(tests, runTest)
    report = generateTestReport(name, testResults)
    testDetails = List.map(testResults, formatTestResult)
    List.concat(report, testDetails) -> List.join("
")
  },
}

export test = squiggleJest.test
export describe = squiggleJest.describe
export expect = squiggleJest.expect

/// Testing ---
model = { items: [1, 2, 3] }
  
testResults = describe(
  "Model Tests",
  [
    test(
      "has items with length 3",
      {|| expect(List.length(model.items)).toBe(3)}
    ),
    test("first item is 1", {|| expect(model.items[0]).toBe(1)}),
    test(
      "last item is greater than 2",
      {|| expect(model.items[2]).toBeGreaterThan(1)}
    ),
    test(
      "second item is less than 3",
      {|| expect(model.items[1]).toBeLessThan(8)}
    ),
    test(
      "contains truthy value",
      {|| expect(List.some(model.items, {|i| i > 0})).toBeTrue()}
    ),
    test(
      "doesn't contain 4",
      {|| expect(List.some(model.items, {|i| i == 4})).toBeFalse()}
    ),
    test("this test should fail", {|| expect(1).toBe(2)}),
  ]
)`;

      default:
        throw new Error(`source ${sourceName} not found`);
    }
  },
};

function summarizeAny(json: any): string {
  return summarizeSimpleValueWithoutLambda(
    removeLambdas(simpleValueFromAny(json)),
    0,
    6
  );
}

type SqOutputSummary = {
  result: string;
  bindings: string;
};

const runSquiggle = async (
  code: string
): Promise<result<SqOutputSummary, string>> => {
  const project = SqProject.create({ linker: linker });
  project.setSource("wrapper", code);
  await project.run("wrapper");
  const output = project.getOutput("wrapper");

  if (output.ok) {
    const outputJS: SqOutputSummary = {
      result: summarizeAny(output.value.result.asJS()),
      bindings: summarizeAny(output.value.bindings.asValue().asJS()),
    };
    return { ok: true, value: outputJS };
  } else {
    return {
      ok: false,
      value:
        "Squiggle Error: \n" +
        (output.value as SqError).toStringWithDetails(project),
    };
  }
};

interface SquiggleRunResult {
  bindings: any;
  result: any;
}

interface ProcessSquiggleResult {
  codeState: CodeState;
  runResult: SquiggleRunResult | null;
}

export async function processSquiggleCode(
  code: string
): Promise<ProcessSquiggleResult> {
  // First, try running code and get errors
  const run = await runSquiggle(code);
  if (!run.ok) {
    return {
      codeState: {
        type: "runFailed",
        code: code,
        error: run.value as string,
      },
      runResult: null,
    };
  }

  // If that works, then try formatting code
  const formattedCode = await formatSquiggleCode(code);
  if (!formattedCode.ok) {
    return {
      codeState: { type: "formattingFailed", code, error: formattedCode.value },
      runResult: null,
    };
  }

  // If both formatting and running succeed
  return {
    codeState: { type: "success", code: formattedCode.value },
    runResult: run.value as SquiggleRunResult,
  };
}
