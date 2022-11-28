import { Lambda } from "./Lambda";
import * as DateTime from "../utility/DateTime";

type LambdaDeclarationArg =
  | {
      type: "Float";
      min: number;
      max: number;
    }
  | {
      type: "Date";
      min: Date;
      max: Date;
    };

export type LambdaDeclaration = Readonly<{
  fn: Lambda;
  args: LambdaDeclarationArg[];
}>;

// module ContinuousFloatArg = {
//   let make = (min: float, max: float): arg => {
//     Float({min, max})
//   }
// }

// module ContinuousTimeArg = {
//   let make = (min: Js.Date.t, max: Js.Date.t): arg => {
//     Date({min, max})
//   }
// }

const argToString = (arg: LambdaDeclarationArg): string => {
  if (arg.type === "Float") {
    return `Float({min: ${arg.min.toPrecision(2)}, max: ${arg.max.toPrecision(
      2
    )})`;
  } else if (arg.type === "Date") {
    return `Date({min: ${DateTime.Date.toString(
      arg.min
    )}, max: ${DateTime.Date.toString(arg.max)}})`;
  } else {
    // never
    return "unknown arg type";
  }
};

// let make = (fn: 'a, args: array<arg>): declaration<'a> => {
//   {fn, args}
// }

export const declarationToString = (
  r: LambdaDeclaration,
  fnToString: (f: Lambda) => string
): string => {
  const args = r.args.map(argToString).join(", ");
  return `fn: ${fnToString(r.fn)}, args: [${args}]`;
};
