import { KindNode, LocationRange } from "../ast/types.js";
import { tAny, tDict, tDictWithArbitraryKeys } from "../types/index.js";
import { Type } from "../types/Type.js";
import { AnalysisContext } from "./context.js";
import { analyzeOneOfKinds } from "./index.js";
import { ExpressionNode } from "./Node.js";
import { NodeIdentifier } from "./NodeIdentifier.js";
import { NodeString } from "./NodeString.js";
import { AnyDictEntryNode } from "./types.js";

export class NodeDict extends ExpressionNode<"Dict"> {
  private constructor(
    location: LocationRange,
    public elements: AnyDictEntryNode[]
  ) {
    const kvTypes: [string, Type<unknown>][] = [];
    let staticKeys = true;
    for (const element of elements) {
      if (element instanceof NodeIdentifier) {
        kvTypes.push([element.value, element.type]);
      } else if (element.key instanceof NodeString) {
        kvTypes.push([element.key.value, element.value.type]);
      } else {
        staticKeys = false;
        break;
      }
    }

    const type = staticKeys
      ? tDict(...kvTypes)
      : tDictWithArbitraryKeys(tAny());

    super("Dict", location, type);
    this._init();
  }

  children() {
    return this.elements;
  }

  // Static key -> node, for faster path resolution.
  // Not used for evaluation.
  private _symbols: Record<number | string, AnyDictEntryNode> | undefined;
  get symbols(): Record<number | string, AnyDictEntryNode> {
    if (!this._symbols) {
      this._symbols = {};
      for (const element of this.elements) {
        if (element.kind === "KeyValue" && element.key.kind === "String") {
          this._symbols[element.key.value] = element;
        } else if (element.kind === "Identifier") {
          this._symbols[element.value] = element;
        }
      }
    }
    return this._symbols;
  }

  static fromAst(node: KindNode<"Dict">, context: AnalysisContext): NodeDict {
    const elements = node.elements.map((element) =>
      analyzeOneOfKinds(element, ["KeyValue", "Identifier"], context)
    );

    return new NodeDict(node.location, elements);
  }
}
