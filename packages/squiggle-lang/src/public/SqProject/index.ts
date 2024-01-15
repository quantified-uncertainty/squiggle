import { isBindingStatement } from "../../ast/utils.js";
import { defaultEnv, Env } from "../../dist/env.js";
import * as Library from "../../library/index.js";
import { createContext } from "../../reducer/context.js";
import { Bindings } from "../../reducer/stack.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import * as Result from "../../utility/result.js";
import { VDict, vDict } from "../../value/index.js";
import { SqError, SqOtherError } from "../SqError.js";
import { SqLinker } from "../SqLinker.js";
import { SqValue, wrapValue } from "../SqValue/index.js";
import { SqDict } from "../SqValue/SqDict.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePath } from "../SqValuePath.js";
import { SqOutputResult } from "../types.js";
import {
  Import,
  ProjectItem,
  RunOutput,
  type Externals,
} from "./ProjectItem.js";

function getNeedToRunError() {
  return new SqOtherError("Need to run");
}

type Options = {
  linker?: SqLinker;
  stdLib?: Bindings;
  environment?: Env;
};

export class SqProject {
  private readonly items: Map<string, ProjectItem>;
  private stdLib: Bindings;
  private environment: Env;
  private linker?: SqLinker; // if not present, imports are forbidden

  // Direct graph of dependencies is maintained inside each ProjectItem,
  // while the inverse one is stored in this variable.
  // We need to update it every time we update the list of direct dependencies:
  // - when sources are deleted
  // - on `setContinues`
  // - on `parseImports`
  // (this list might be incomplete)
  private inverseGraph: Map<string, Set<string>> = new Map();

  constructor(options?: Options) {
    this.items = new Map();
    this.stdLib = options?.stdLib ?? Library.getStdLib();
    this.environment = options?.environment ?? defaultEnv;
    this.linker = options?.linker;
  }

  static create(options?: Options) {
    return new SqProject(options);
  }

  getEnvironment(): Env {
    return this.environment;
  }

  setEnvironment(environment: Env) {
    // TODO - should we invalidate all outputs?
    this.environment = environment;
  }

  getStdLib(): Bindings {
    return this.stdLib;
  }

  getSourceIds(): string[] {
    return Array.from(this.items.keys());
  }

  private getItem(sourceId: string): ProjectItem {
    const item = this.items.get(sourceId);
    if (!item) {
      throw new Error(`Source ${sourceId} not found`);
    }
    return item;
  }

  private cleanDependents(initialSourceId: string) {
    // Traverse dependents recursively and call "clean" on each.
    const visited = new Set<string>();
    const inner = (currentSourceId: string) => {
      visited.add(currentSourceId);
      if (currentSourceId !== initialSourceId) {
        this.clean(currentSourceId);
      }
      for (const sourceId of this.getDependents(currentSourceId)) {
        if (visited.has(sourceId)) {
          continue;
        }
        inner(sourceId);
      }
    };
    inner(initialSourceId);
  }

  getDependents(sourceId: string): string[] {
    return [...(this.inverseGraph.get(sourceId)?.values() ?? [])];
  }

  getDependencies(sourceId: string): string[] {
    this.parseImports(sourceId);
    return this.getItem(sourceId).getDependencies();
  }

  // Removes only explicit imports (not continues).
  // Useful on source changes.
  private removeImportEdges(fromSourceId: string) {
    const item = this.getItem(fromSourceId);
    if (item.imports?.ok) {
      for (const importData of item.imports.value) {
        this.inverseGraph.get(importData.sourceId)?.delete(fromSourceId);
      }
    }
  }

  touchSource(sourceId: string) {
    this.removeImportEdges(sourceId);
    this.getItem(sourceId).touchSource();
    this.cleanDependents(sourceId);
  }

  setSource(sourceId: string, value: string) {
    if (this.items.has(sourceId)) {
      this.removeImportEdges(sourceId);
      this.getItem(sourceId).setSource(value);
      this.cleanDependents(sourceId);
    } else {
      this.items.set(sourceId, new ProjectItem({ sourceId, source: value }));
    }
  }

  removeSource(sourceId: string) {
    if (!this.items.has(sourceId)) {
      return;
    }
    this.cleanDependents(sourceId);
    this.removeImportEdges(sourceId);
    this.setContinues(sourceId, []);
    this.items.delete(sourceId);
  }

  getSource(sourceId: string) {
    return this.items.get(sourceId)?.source;
  }

  clean(sourceId: string) {
    this.getItem(sourceId).clean();
  }

  cleanAll() {
    this.getSourceIds().forEach((id) => this.clean(id));
  }

  getImportIds(sourceId: string): Result.result<string[], SqError> {
    const imports = this.getImports(sourceId);
    if (!imports) {
      return Result.Err(getNeedToRunError());
    }
    return Result.fmap(imports, (imports) => imports.map((i) => i.sourceId));
  }

  getImports(sourceId: string): Result.result<Import[], SqError> | undefined {
    return this.getItem(sourceId).imports;
  }

  getContinues(sourceId: string): string[] {
    return this.getItem(sourceId).continues;
  }

  setContinues(sourceId: string, continues: string[]): void {
    for (const continueId of this.getContinues(sourceId)) {
      this.inverseGraph.get(continueId)?.delete(sourceId);
    }
    for (const continueId of continues) {
      if (!this.inverseGraph.has(continueId)) {
        this.inverseGraph.set(continueId, new Set());
      }
      this.inverseGraph.get(continueId)?.add(sourceId);
    }
    this.getItem(sourceId).setContinues(continues);
    this.cleanDependents(sourceId);
  }

  private getInternalOutput(
    sourceId: string
  ): Result.result<RunOutput, SqError> {
    return this.getItem(sourceId).output ?? Result.Err(getNeedToRunError());
  }

  private parseImports(sourceId: string): void {
    // linker can be undefined; in this case parseImports will fail if there are any imports
    const item = this.getItem(sourceId);
    if (item.imports) {
      // already set, shortcut so that we don't have to update `inverseGraph`
      return;
    }

    item.parseImports(this.linker);
    for (const dependencyId of item.getDependencies()) {
      if (!this.inverseGraph.has(dependencyId)) {
        this.inverseGraph.set(dependencyId, new Set());
      }
      this.inverseGraph.get(dependencyId)?.add(sourceId);
    }
  }

  getOutput(sourceId: string): SqOutputResult {
    const internalOutputR = this.getInternalOutput(sourceId);
    if (!internalOutputR.ok) {
      return internalOutputR;
    }

    const source = this.getSource(sourceId);
    if (source === undefined) {
      throw new Error("Internal error: source not found");
    }

    const astR = this.getItem(sourceId).ast;
    if (!astR) {
      throw new Error("Internal error: AST is missing when result is ok");
    }
    if (!astR.ok) {
      return astR; // impossible because output is valid
    }
    const ast = astR.value;

    const lastStatement = ast.statements.at(-1);

    const hasEndExpression =
      !!lastStatement && !isBindingStatement(lastStatement);

    const result = wrapValue(
      internalOutputR.value.result,
      new SqValueContext({
        project: this,
        sourceId,
        source,
        ast,
        valueAst: hasEndExpression ? lastStatement : ast,
        valueAstIsPrecise: hasEndExpression,
        path: new SqValuePath({
          root: "result",
          items: [],
        }),
      })
    );

    const [bindings, exports] = (["bindings", "exports"] as const).map(
      (field) => {
        const innerDict = internalOutputR.value[field];
        const dict = new SqDict(
          field === "exports"
            ? innerDict.mergeTags({ name: sourceId })
            : innerDict,
          new SqValueContext({
            project: this,
            sourceId,
            source,
            ast: astR.value,
            valueAst: astR.value,
            valueAstIsPrecise: true,
            path: new SqValuePath({
              root: "bindings",
              items: [],
            }),
          })
        );
        return dict;
      }
    );

    return Result.Ok({ result, bindings, exports });
  }

  getResult(sourceId: string): Result.result<SqValue, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ result }) => result);
  }

  getBindings(sourceId: string): Result.result<SqDict, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ bindings }) => bindings);
  }

  private async importToBindingResult(
    importBinding: Import,
    pendingIds: Set<string>
  ): Promise<Result.result<VDict, SqError>> {
    if (!this.items.has(importBinding.sourceId)) {
      if (!this.linker) {
        throw new Error(
          `Can't load source for ${importBinding.sourceId}, linker is missing`
        );
      }

      // We have got one of the new imports.
      // Let's load it and add it to the project.
      let newSource: string;
      try {
        newSource = await this.linker.loadSource(importBinding.sourceId);
      } catch (e) {
        return Result.Err(
          new SqOtherError(`Failed to load import ${importBinding.sourceId}`)
        );
      }
      this.setSource(importBinding.sourceId, newSource);
    }

    if (pendingIds.has(importBinding.sourceId)) {
      // Oh we have already visited this source. There is an import cycle.
      return Result.Err(
        new SqOtherError(`Cyclic import ${importBinding.sourceId}`)
      );
    }

    await this.innerRun(importBinding.sourceId, pendingIds);
    const outputR = this.getInternalOutput(importBinding.sourceId);
    if (!outputR.ok) {
      return outputR;
    }

    // TODO - check for name collisions?
    switch (importBinding.type) {
      case "flat":
        return Result.Ok(outputR.value.bindings);
      case "named":
        return Result.Ok(
          vDict(
            ImmutableMap({
              [importBinding.variable]: outputR.value.exports,
            })
          )
        );
      default:
        throw new Error(`Internal error, ${importBinding satisfies never}`);
    }
  }

  private async importsToBindings(
    pendingIds: Set<string>,
    imports: Import[]
  ): Promise<Result.result<VDict, SqError>> {
    let exports = VDict.empty();

    for (const importBinding of imports) {
      const loadResult = await this.importToBindingResult(
        importBinding,
        pendingIds
      );
      if (!loadResult.ok) return loadResult; // Early return for load/validation errors

      exports = exports.merge(loadResult.value);
    }
    return Result.Ok(exports);
  }

  // Includes implicit imports ("continues"), explicit imports, and StdLib.
  private async buildExternals(
    sourceId: string,
    pendingIds: Set<string>
  ): Promise<Result.result<Externals, SqError>> {
    this.parseImports(sourceId);

    const rImports = this.getImports(sourceId);
    if (!rImports) throw new Error("Internal logic error"); // Shouldn't happen, we just called parseImports.
    if (!rImports.ok) return rImports; // There's something wrong with imports, that's fatal.

    const stdlibExternals = vDict(this.getStdLib());

    const implicitImports = await this.importsToBindings(
      pendingIds,
      this.getItem(sourceId).getImplicitImports()
    );

    if (!implicitImports.ok) return implicitImports;
    const explicitImports = await this.importsToBindings(
      pendingIds,
      rImports.value
    );
    if (!explicitImports.ok) return explicitImports;

    return Result.Ok({
      stdlib: stdlibExternals,
      implicitImports: implicitImports.value,
      explicitExports: explicitImports.value,
    });
  }

  private async innerRun(sourceId: string, pendingIds: Set<string>) {
    pendingIds.add(sourceId);

    const cachedOutput = this.getItem(sourceId).output;
    if (!cachedOutput) {
      const rExternals = await this.buildExternals(sourceId, pendingIds);

      if (!rExternals.ok) {
        this.getItem(sourceId).failRun(rExternals.value);
      } else {
        const context = createContext(this.getEnvironment());
        await this.getItem(sourceId).run(context, rExternals.value);
      }
    }

    pendingIds.delete(sourceId);
  }

  async run(sourceId: string) {
    await this.innerRun(sourceId, new Set());
  }

  // Helper method for "Find in Editor" feature
  findValuePathByOffset(
    sourceId: string,
    offset: number
  ): Result.result<SqValuePath, SqError> {
    const { ast } = this.getItem(sourceId);
    if (!ast) {
      return Result.Err(new SqOtherError("Not parsed"));
    }
    if (!ast.ok) {
      return ast;
    }
    const found = SqValuePath.findByOffset({
      ast: ast.value,
      offset,
    });
    if (!found) {
      return Result.Err(new SqOtherError("Not found"));
    }
    return Result.Ok(found);
  }
}
