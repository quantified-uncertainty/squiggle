import { KindNode, LocationRange } from "../ast/types.js";
import { ICompileError } from "../errors/IError.js";
import { unitNameToBuiltinFunctionName } from "../fr/units.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeKind } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { NodeFloat } from "./NodeFloat.js";

export class NodeUnitValue extends ExpressionNode<"UnitValue"> {
  private constructor(
    location: LocationRange,
    public value: NodeFloat,
    public unit: string,
    type: Type
  ) {
    super("UnitValue", location, type);
    this._init();
  }

  children() {
    return [this.value];
  }

  static fromAst(
    node: KindNode<"UnitValue">,
    context: AnalysisContext
  ): NodeUnitValue {
    const fn = context.stdlib.get(unitNameToBuiltinFunctionName(node.unit));
    if (!fn) {
      // shouldn't happen
      throw new ICompileError(
        `Internal error: Unit function not found: '${node.unit}'`,
        node.location
      );
    }
    if (fn.type !== "Lambda") {
      throw new ICompileError(
        `Internal error: Expected unit function to be a function`,
        node.location
      );
    }

    return new NodeUnitValue(
      node.location,
      analyzeKind(node.value, "Float", context),
      node.unit,
      fn.value.signatures()[0].output
    );
  }
}
