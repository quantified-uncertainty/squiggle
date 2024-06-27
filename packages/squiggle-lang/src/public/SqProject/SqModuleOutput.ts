import { isBindingStatement } from "../../ast/utils.js";
import { Env } from "../../dists/env.js";
import { BaseRunner, RunParams } from "../../runners/BaseRunner.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { Err, fmap2, Ok, result } from "../../utility/result.js";
import { vDict, VDict } from "../../value/VDict.js";
import { vString } from "../../value/VString.js";
import { SqError, SqOtherError, wrapError } from "../SqError.js";
import { SqValue, wrapValue } from "../SqValue/index.js";
import { SqDict } from "../SqValue/SqDict.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePath, ValuePathRoot } from "../SqValuePath.js";
import { Externals, RunContext } from "./ProjectItem.js";
import { ProjectState } from "./ProjectState.js";
import { ResolvedModule } from "./ResolvedModule.js";
import { getHash } from "./utils.js";

export type OutputResult = result<
  {
    result: SqValue;
    bindings: SqDict;
    imports: SqDict;
    exports: SqDict;
  },
  SqError
>;

export class SqModuleOutput {
  module: ResolvedModule;
  environment: Env;
  output: OutputResult;
  executionTime: number;

  private constructor(params: {
    module: ResolvedModule;
    environment: Env;
    output: OutputResult;
    executionTime: number;
  }) {
    this.module = params.module;
    this.environment = params.environment;
    this.output = params.output;
    this.executionTime = params.executionTime;
  }

  hash(): string {
    return SqModuleOutput.hash({
      module: this.module,
      environment: this.environment,
    });
  }

  // Helper method for "Find in Editor" feature
  findValuePathByOffset(offset: number): result<SqValuePath, SqError> {
    const ast = this.module.module.ast();
    if (!ast.ok) {
      return ast;
    }
    const found = SqValuePath.findByAstOffset({
      ast: ast.value,
      offset,
    });
    if (!found) {
      return Err(new SqOtherError("Not found"));
    }
    return Ok(found);
  }

  /*
   * This static method creates a new ModuleOutput instance by running the module.
   * It depends on ProjectState.outputs to find the output of the module's imports.
   *
   * Note that all import outputs should already exist in state; this method
   * intentionally doesn't attempt to recursively run the dependencies.
   */
  static async make(params: {
    module: ResolvedModule;
    environment: Env;
    runner: BaseRunner;
    state: ProjectState;
  }): Promise<SqModuleOutput> {
    const { environment, module } = params;

    const astR = module.module.ast();
    if (!astR.ok) {
      return new SqModuleOutput({
        module,
        environment,
        output: astR,
        executionTime: 0,
      });
    }
    const ast = astR.value;

    let importBindings = VDict.empty();

    for (const importBinding of module.module.imports()) {
      const importedModule = module.resolutions[importBinding.name];
      if (!importedModule) {
        // shouldn't happen, ResolvedModule constructor verifies that imports and resolutions match
        throw new Error(
          `Can't find resolved import module ${importBinding.name}`
        );
      }
      const importOutputHash = SqModuleOutput.hash({
        module: importedModule,
        environment,
      });
      const importOutput = params.state.outputs.get(importOutputHash);
      if (!importOutput) {
        throw new Error(`Can't find output with hash ${importOutputHash}`);
      }
      if (!importOutput.output.ok) {
        return importOutput;
      }
      importBindings = importBindings.merge(
        vDict(
          ImmutableMap({
            [importBinding.variable]: importOutput.output.value.exports._value,
          })
        )
      );
    }
    const externals: Externals = {
      implicitImports: vDict(ImmutableMap()),
      explicitImports: importBindings,
    };

    const context: RunContext = {
      ast,
      sourceId: module.module.name,
      source: module.module.code,
      environment,
      externals,
    };

    const runParams: RunParams = {
      ast,
      environment,
      externals: importBindings,
    };

    const started = new Date();
    const runResult = await params.runner.run(runParams);
    const executionTime = new Date().getTime() - started.getTime();

    // // patch profile - add timings for import statements
    // if (runResult.ok && runResult.value.profile) {
    //   for (const item of module.module.imports()) {
    //     const importOutput = project.getInternalOutput(item.sourceId);
    //     if (importOutput.ok) {
    //       runResult.value.profile.addRange(
    //         item.location,
    //         importOutput.value.executionTime
    //       );
    //     }
    //   }
    // }

    // upgrade runOutput values from the runner to SqValues
    const output = fmap2(
      runResult,
      (runOutput) => {
        const { result, bindings, exports } = runOutput;
        const lastStatement = ast.statements.at(-1);

        const hasEndExpression =
          !!lastStatement && !isBindingStatement(lastStatement);

        const newContext = (root: ValuePathRoot) => {
          const isResult = root === "result";
          return new SqValueContext({
            runContext: context,
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

        return {
          result: wrapValue(result, newContext("result")),
          bindings: wrapSqDict(bindings, "bindings"),
          exports: wrapSqDict(
            exports.mergeTags({ name: vString(params.module.module.name) }),
            // In terms of context, exports are the same as bindings.
            "bindings"
          ),
          imports: wrapSqDict(externals.explicitImports, "imports"),
        };
      },
      (err) => wrapError(err)
    );

    return new SqModuleOutput({
      module,
      environment,
      output,
      executionTime,
    });
  }

  static hash(params: { module: ResolvedModule; environment: Env }): string {
    return (
      `output-${params.module.module.name}-` +
      getHash(
        JSON.stringify({
          module: params.module.hash(),
          environment: params.environment,
        })
      )
    );
  }
}
