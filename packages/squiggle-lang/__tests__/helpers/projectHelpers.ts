import { SqDict } from "../../src/index.js";
import { SqError } from "../../src/public/SqError.js";
import { SqProject } from "../../src/public/SqProject/index.js";
import { SqValue } from "../../src/public/SqValue/index.js";
import { result } from "../../src/utility/result.js";

export function valueResultToString(result: result<SqValue, SqError>) {
  return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
}

export function dictResultToString(result: result<SqDict, SqError>) {
  if (result.ok) {
    return result.value.toString();
  } else {
    return `Error(${result.value})`;
  }
}

export async function runFetchResult(project: SqProject, headName: string) {
  const output = await project.waitForOutput(headName);
  return valueResultToString(output.getEndResult());
}

export async function runFetchBindings(project: SqProject, headName: string) {
  const output = await project.waitForOutput(headName);
  return dictResultToString(output.getBindings());
}

export async function runFetchExports(project: SqProject, headName: string) {
  const output = await project.waitForOutput(headName);
  return dictResultToString(output.getExports());
}
