// import {
//   errorValue,
//   parse as parseRescript,
// } from "../rescript/TypescriptInterface.gen";
// import { result } from "./types";
// import { AnyPeggyNode } from "../rescript/Reducer/Reducer_Peggy/helpers";

// export function parse(
//   squiggleString: string
// ): result<AnyPeggyNode, Extract<errorValue, { tag: "RESyntaxError" }>> {
//   const maybeExpression = parseRescript(squiggleString);
//   if (maybeExpression.tag === "Ok") {
//     return { tag: "Ok", value: maybeExpression.value as AnyPeggyNode };
//   } else {
//     if (
//       typeof maybeExpression.value !== "object" ||
//       maybeExpression.value.tag !== "RESyntaxError"
//     ) {
//       throw new Error("Expected syntax error");
//     }
//     return { tag: "Error", value: maybeExpression.value };
//   }
// }
