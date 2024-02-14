import { blue } from "../cli/colors.js";

export type SExpr =
  | {
      name: string;
      args: (SExpr | undefined)[];
    }
  | string
  | number;

export function sExpr(name: string, args: SExpr[]): SExpr {
  return {
    name,
    args,
  };
}

function space(n: number) {
  return " ".repeat(n * 2);
}

export type SExprPrintOptions = {
  depth?: number;
  pretty?: boolean;
  colored?: boolean;
};

export function sExprToString(
  expr: SExpr,
  opts: { depth?: number } & SExprPrintOptions = {}
) {
  const { depth = 0, pretty = true, colored = false } = opts;

  if (typeof expr === "string" || typeof expr === "number") {
    return String(expr);
  }

  const stringifiedArgs: string[] = [];
  let nested = false;
  for (const arg of expr.args) {
    if (arg === undefined) continue;
    stringifiedArgs.push(sExprToString(arg, { ...opts, depth: depth + 1 }));
    if (typeof arg === "object") nested = true;
  }

  return (
    "(" +
    (colored ? blue(expr.name) : expr.name) +
    (nested && pretty
      ? "\n" +
        stringifiedArgs.map((str) => space(depth + 1) + str + "\n").join("") +
        space(depth)
      : stringifiedArgs.length
        ? " " + stringifiedArgs.join(" ")
        : "") +
    ")"
  );
}
