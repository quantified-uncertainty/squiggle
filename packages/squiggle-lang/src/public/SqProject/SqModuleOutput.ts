import { Env } from "../../dists/env.js";
import { RunProfile } from "../../reducer/RunProfile.js";
import { BaseRunner, RunParams } from "../../runners/BaseRunner.js";
import { Err, fmap, fmap2, Ok, result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { VDict, vDictFromArray } from "../../value/VDict.js";
import { vString } from "../../value/VString.js";
import {
  SqError,
  SqErrorList,
  SqImportError,
  SqOtherError,
  wrapIError,
} from "../SqError.js";
import { SqValue, wrapValue } from "../SqValue/index.js";
import { SqDict } from "../SqValue/SqDict.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePath, ValuePathRoot } from "../SqValuePath.js";
import { ProjectState } from "./ProjectState.js";
import { Import, SqModule } from "./SqModule.js";
import { getHash } from "./utils.js";

export type OutputResult = result<
  {
    result: SqValue;
    bindings: SqDict;
    imports: SqDict;
    exports: SqDict;
    profile: RunProfile | undefined;
  },
  SqErrorList
>;

export class SqModuleOutput {
  module: SqModule;
  environment: Env;
  result: OutputResult;
  executionTime: number;

  private constructor(params: {
    module: SqModule;
    environment: Env;
    result: OutputResult;
    executionTime: number;
  }) {
    this.module = params.module;
    this.environment = params.environment;
    this.result = params.result;
    this.executionTime = params.executionTime;
  }

  hash(): string {
    return SqModuleOutput.hash({
      module: this.module,
      environment: this.environment,
    });
  }

  // "result" word is overloaded, so we use "end result" for clarity.
  // TODO: it would also be good to rename "result" to "endResult" in the OutputResult and runners code for the same reason.
  getEndResult(): result<SqValue, SqErrorList> {
    return fmap(this.result, (r) => r.result);
  }

  getBindings(): result<SqDict, SqErrorList> {
    return fmap(this.result, (r) => r.bindings);
  }

  getExports(): result<SqDict, SqErrorList> {
    return fmap(this.result, (r) => r.exports);
  }

  // Helper method for "Find in Editor" feature
  findValuePathByOffset(offset: number): result<SqValuePath, SqErrorList> {
    const ast = this.module.ast();
    if (!ast.ok) {
      return Err(new SqErrorList(ast.value));
    }
    const found = SqValuePath.findByAstOffset({
      ast: ast.value,
      offset,
    });
    if (!found) {
      return Err(new SqErrorList([new SqOtherError("Not found")]));
    }
    return Ok(found);
  }

  /*
   * This static method creates a new ModuleOutput instance by running the module.
   * It depends on ProjectState.outputs to find the output of the module's imports.
   *
   * If any of imports are not loaded yet, it returns undefined.
   *
   * If any of imports failed to load, or their outputs are failed, it returns a failed output.
   */
  static async make(params: {
    module: SqModule;
    environment: Env;
    runner: BaseRunner;
    state: ProjectState;
  }): Promise<SqModuleOutput | undefined> {
    const { environment, module } = params;

    const importOutputs = module.getImportOutputs({
      state: params.state,
      environment,
    });

    if (importOutputs.type === "failed") {
      return new SqModuleOutput({
        module,
        environment,
        result: Err(importOutputs.value),
        executionTime: 0,
      });
    }

    if (importOutputs.type === "loading") {
      return undefined;
    }

    const importBindings: Record<string, Value> = {};

    // useful for profiling later
    const importsAndOutputs: {
      importBinding: Import;
      importOutput: SqModuleOutput;
    }[] = [];

    for (const importBinding of module.getImports(params.state.linker)) {
      const importOutput = importOutputs.value[importBinding.name];
      if (!importOutput) {
        throw new Error(
          `Internal error, can't find output ${importBinding.name} in importOutputs`
        );
      }
      if (!importOutput.result.ok) {
        return new SqModuleOutput({
          module,
          environment,
          result: Err(
            new SqErrorList(
              importOutput.result.value.errors.map(
                (err) => new SqImportError(err, importBinding)
              )
            )
          ),
          executionTime: 0,
        });
      }
      importBindings[importBinding.path] =
        importOutput.result.value.exports._value;

      importsAndOutputs.push({
        importBinding,
        importOutput,
      });
    }

    const runParams: RunParams = {
      module,
      environment,
      imports: importBindings,
    };

    const started = new Date();
    let runResult;
    try {
      runResult = await params.runner.run(runParams);
    } catch (e) {
      return new SqModuleOutput({
        module,
        environment,
        result: Err(new SqErrorList([new SqOtherError(String(e))])),
        executionTime: new Date().getTime() - started.getTime(),
      });
    }

    const executionTime = new Date().getTime() - started.getTime();

    // patch profile - add timings for import statements
    if (runResult.ok && runResult.value.profile) {
      for (const { importBinding, importOutput } of importsAndOutputs) {
        if (importOutput.result.ok) {
          runResult.value.profile.addRange(
            importBinding.location,
            importOutput.executionTime
          );
        }
      }
    }

    // upgrade result values from the runner to SqValues
    const result = fmap2(
      runResult,
      (runOutput) => {
        // AST is guaranteed to be ok, otherwise the run would fail.
        // TODO: this will slow down the run, can we do this is parallel with the runner, or marshall the typed AST from the worker?
        const ast = module.expectTypedAst();

        const { result, bindings, exports } = runOutput;

        const newContext = (root: ValuePathRoot) => {
          const isResult = root === "result";
          return new SqValueContext({
            runContext: runParams,
            valueAst: isResult && ast.result ? ast.result : ast,
            valueAstIsPrecise: isResult ? !!ast.result : true,
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
            exports.mergeTags({ name: vString(params.module.name) }),
            // In terms of context, exports are the same as bindings.
            "bindings"
          ),
          imports: wrapSqDict(
            vDictFromArray(Object.entries(importBindings)),
            "imports"
          ),
          profile: runOutput.profile,
        };
      },
      (errors) => new SqErrorList(errors.map((err) => wrapIError(err)))
    );

    return new SqModuleOutput({
      module,
      environment,
      result,
      executionTime,
    });
  }

  static makeError(params: {
    module: SqModule;
    environment: Env;
    error: SqError;
  }): SqModuleOutput {
    return new SqModuleOutput({
      module: params.module,
      environment: params.environment,
      result: Err(new SqErrorList([params.error])),
      executionTime: 0,
    });
  }

  static hash(params: { module: SqModule; environment: Env }): string {
    return getHash(
      `output/${params.module.name}/` +
        JSON.stringify({
          module: params.module.hash(),
          environment: params.environment,
        })
    );
  }
}
