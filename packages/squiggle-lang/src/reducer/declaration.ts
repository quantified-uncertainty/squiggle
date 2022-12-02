import { Lambda } from "./lambda";
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

export const declarationToString = (
  r: LambdaDeclaration,
  fnToString: (f: Lambda) => string
): string => {
  const args = r.args.map(argToString).join(", ");
  return `fn: ${fnToString(r.fn)}, args: [${args}]`;
};
