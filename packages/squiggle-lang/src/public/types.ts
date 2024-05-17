import { isBindingStatement } from "../ast/utils.js";
import { result } from "../utility/result.js";
import { vString } from "../value/index.js";
import { VDict } from "../value/VDict.js";
import { SqError } from "./SqError.js";
import { ProjectItemOutput } from "./SqProject/ProjectItem.js";
import { SqValue, wrapValue } from "./SqValue/index.js";
import { SqDict } from "./SqValue/SqDict.js";
import { SqValueContext } from "./SqValueContext.js";
import { SqValuePath, ValuePathRoot } from "./SqValuePath.js";

export class SqOutput {
  result: SqValue;
  bindings: SqDict;
  imports: SqDict;
  exports: SqDict;
  raw: ProjectItemOutput; // original output, not upgraded to SqValues - useful if you want to do serialization

  private constructor(params: {
    result: SqValue;
    bindings: SqDict;
    imports: SqDict;
    exports: SqDict;
    raw: ProjectItemOutput;
  }) {
    this.result = params.result;
    this.bindings = params.bindings;
    this.imports = params.imports;
    this.exports = params.exports;
    this.raw = params.raw;
  }

  static fromProjectItemOutput(output: ProjectItemOutput) {
    const { externals, ast, sourceId } = output.context;
    const { result, bindings, exports } = output.runOutput;

    const lastStatement = ast.statements.at(-1);

    const hasEndExpression =
      !!lastStatement && !isBindingStatement(lastStatement);

    const newContext = (root: ValuePathRoot) => {
      const isResult = root === "result";
      return new SqValueContext({
        runContext: output.context,
        valueAst: isResult && hasEndExpression ? lastStatement : ast,
        valueAstIsPrecise: isResult ? hasEndExpression : true,
        path: new SqValuePath({
          root,
          edges: [],
        }),
      });
    };

    const wrapSqDict = (innerDict: VDict, root: ValuePathRoot): SqDict => {
      return new SqDict(innerDict, newContext(root));
    };

    return new SqOutput({
      result: wrapValue(result, newContext("result")),
      bindings: wrapSqDict(bindings, "bindings"),
      exports: wrapSqDict(
        exports.mergeTags({ name: vString(sourceId) }),
        // In terms of context, exports are the same as bindings.
        "bindings"
      ),
      imports: wrapSqDict(externals.explicitImports, "imports"),
      raw: output,
    });
  }
}

export type SqOutputResult = result<SqOutput, SqError>;
