import {
  sExpr,
  SExpr,
  SExprPrintOptions,
  sExprToString,
} from "../utility/sExpr.js";
import { IRContent } from "./types.js";

/**
 * Converts the IR to string. Useful for tests.
 * Example:

(Program
  (.statements
    (Assign
      f
      (Block 99)
    )
    (Assign
      g
      (Lambda
        (.captures
          (StackRef 0)
        )
        (.parameters x)
        (Block
          (CaptureRef 0)
        )
      )
    )
    (Call
      (StackRef 0)
      2
    )
  )
  (.bindings
    (f 1)
    (g 0)
  )
)

 */
export function irToString(
  ir: IRContent,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (ir: IRContent): SExpr => {
    const selfExpr = (args: (SExpr | undefined)[]): SExpr => ({
      name: ir.kind,
      args,
    });

    switch (ir.kind) {
      case "Block":
        return selfExpr([...ir.value.statements, ir.value.result].map(toSExpr));
      case "Program":
        return selfExpr([
          ir.value.statements.length
            ? sExpr(".statements", ir.value.statements.map(toSExpr))
            : undefined,
          Object.keys(ir.value.bindings).length
            ? sExpr(
                ".bindings",
                Object.entries(ir.value.bindings).map(([name, offset]) =>
                  sExpr(name, [offset])
                )
              )
            : undefined,
          ir.value.exports.length
            ? sExpr(".exports", ir.value.exports)
            : undefined,
          ir.value.result ? toSExpr(ir.value.result) : undefined,
        ]);
      case "Array":
        return selfExpr(ir.value.map(toSExpr));
      case "Dict":
        return selfExpr(ir.value.map((pair) => sExpr("kv", pair.map(toSExpr))));
      case "StackRef":
        return selfExpr([ir.value]);
      case "CaptureRef":
        return selfExpr([ir.value]);
      case "Ternary":
        return selfExpr(
          [ir.value.condition, ir.value.ifTrue, ir.value.ifFalse].map(toSExpr)
        );
      case "Assign":
        return selfExpr([ir.value.left, toSExpr(ir.value.right)]);
      case "Call":
        return selfExpr([ir.value.fn, ...ir.value.args].map(toSExpr));
      case "Lambda":
        return selfExpr([
          ir.value.captures.length
            ? sExpr(".captures", ir.value.captures.map(toSExpr))
            : undefined,
          sExpr(
            ".parameters",
            ir.value.parameters.map((parameter) =>
              parameter.annotation
                ? sExpr(".annotated", [
                    parameter.name,
                    toSExpr(parameter.annotation),
                  ])
                : parameter.name
            )
          ),
          toSExpr(ir.value.body),
        ]);
      case "Value":
        return ir.value.toString();
      default:
        return `Unknown IR node ${ir satisfies never}`;
    }
  };

  return sExprToString(toSExpr(ir), printOptions);
}
