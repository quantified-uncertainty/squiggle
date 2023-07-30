import { isBindingStatement } from "../../ast/utils.js";
import { Env, defaultEnv } from "../../dist/env.js";
import * as Library from "../../library/index.js";
import { createContext } from "../../reducer/context.js";
import { Bindings } from "../../reducer/stack.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import * as Result from "../../utility/result.js";
import { Value, vDict } from "../../value/index.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqDict } from "../SqValue/SqDict.js";
import { SqValue, wrapValue } from "../SqValue/index.js";
import { SqValuePath } from "../SqValuePath.js";

import { SqValueContext } from "../SqValueContext.js";
import { ImportBinding, ProjectItem, RunOutput } from "./ProjectItem.js";
import { Resolver } from "./Resolver.js";
import * as Topology from "./Topology.js";
import { SqOutputResult } from "../types.js";

function getNeedToRunError() {
  return new SqOtherError("Need to run");
}

// TODO - pass the the id from which the dependency was imported/continued too
function getMissingDependencyError(id: string) {
  return new SqOtherError(`Dependency ${id} is missing`);
}

type Options = {
  resolver?: Resolver;
};

export class SqProject {
  private readonly items: Map<string, ProjectItem>;
  private stdLib: Bindings;
  private environment: Env;
  private resolver?: Resolver; // if not present, imports are forbidden

  constructor(options?: Options) {
    this.items = new Map();
    this.stdLib = Library.getStdLib();
    this.environment = defaultEnv;
    this.resolver = options?.resolver;
  }

  static create(options?: { resolver: Resolver }) {
    return new SqProject(options);
  }

  setEnvironment(environment: Env) {
    this.environment = environment;
  }

  getEnvironment(): Env {
    return this.environment;
  }

  getStdLib(): Bindings {
    return this.stdLib;
  }

  setStdLib(value: Bindings) {
    this.stdLib = value;
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

  private touchDependents(sourceId: string) {
    Topology.traverseDependents(this, sourceId, (id) => this.clean(id));
  }

  getDependencies(sourceId: string): string[] {
    return this.getItem(sourceId).getDependencies();
  }

  getRunOrder(): string[] {
    return Topology.getRunOrder(this);
  }

  getRunOrderFor(sourceId: string): string[] {
    return Topology.getRunOrderFor(this, sourceId);
  }

  getDependents(sourceId: string) {
    return Topology.getDependents(this, sourceId);
  }

  touchSource(sourceId: string) {
    this.getItem(sourceId).touchSource();
    this.touchDependents(sourceId);
  }

  setSource(sourceId: string, value: string) {
    if (this.items.has(sourceId)) {
      this.getItem(sourceId).setSource(value);
    } else {
      this.items.set(sourceId, new ProjectItem({ sourceId, source: value }));
    }
    this.touchDependents(sourceId);
  }

  removeSource(sourceId: string) {
    this.touchDependents(sourceId);
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

  getImports(
    sourceId: string
  ): Result.result<ImportBinding[], SqError> | undefined {
    return this.getItem(sourceId).imports;
  }

  getContinues(sourceId: string): string[] {
    return this.getItem(sourceId).continues;
  }

  setContinues(sourceId: string, continues: string[]): void {
    this.getItem(sourceId).setContinues(continues);
    this.touchDependents(sourceId);
  }

  private getInternalOutput(
    sourceId: string
  ): Result.result<RunOutput, SqError> {
    return this.getItem(sourceId).output ?? Result.Err(getNeedToRunError());
  }

  parseImports(sourceId: string): void {
    // resolver can be undefined; in this case parseImports will fail if there are any imports
    this.getItem(sourceId).parseImports(this.resolver);
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

    const lastStatement =
      ast.type === "Program" ? ast.statements.at(-1) : undefined;

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

    const bindings = new SqDict(
      internalOutputR.value.bindings,
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

    return Result.Ok({ result, bindings });
  }

  getResult(sourceId: string): Result.result<SqValue, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ result }) => result);
  }

  getBindings(sourceId: string): Result.result<SqDict, SqError> {
    return Result.fmap(this.getOutput(sourceId), ({ bindings }) => bindings);
  }

  private buildExternals(sourceId: string): Result.result<Bindings, SqError> {
    const continues = this.getContinues(sourceId);

    // We start from stdLib and add more bindings on top of it.
    const namespacesToMerge = [this.getStdLib()];

    // First, merge continues.
    for (const continueId of continues) {
      if (!this.items.has(continueId)) {
        return Result.Err(getMissingDependencyError(continueId));
      }
      const outputR = this.getInternalOutput(continueId);
      if (!outputR.ok) {
        return outputR;
      }

      namespacesToMerge.push(outputR.value.bindings);
    }
    let externals: Bindings = ImmutableMap<string, Value>().merge(
      ...namespacesToMerge
    );

    // Second, merge imports.
    this.parseImports(sourceId);
    const rImports = this.getImports(sourceId);
    if (!rImports) {
      // Shouldn't happen, we just called parseImports.
      return Result.Err(new SqOtherError("Internal logic error"));
    }

    if (!rImports.ok) {
      // Shouldn't happen, getImports fail only if parse failed.
      return rImports;
    }
    for (const importBinding of rImports.value) {
      if (!this.items.has(importBinding.sourceId)) {
        return Result.Err(getMissingDependencyError(importBinding.sourceId));
      }
      const importOutputR = this.getItem(importBinding.sourceId).output;
      if (!importOutputR) {
        return Result.Err(getNeedToRunError());
      }
      if (!importOutputR.ok) {
        return importOutputR;
      }

      // TODO - check for collisions?
      externals = externals.set(
        importBinding.variable,
        vDict(importOutputR.value.bindings)
      );
    }
    return Result.Ok(externals);
  }

  private async doLinkAndRun(sourceId: string): Promise<void> {
    const rExternals = this.buildExternals(sourceId);

    if (rExternals.ok) {
      const context = createContext(this.getEnvironment());

      await this.getItem(sourceId).run(context, rExternals.value);
    } else {
      this.getItem(sourceId).failRun(rExternals.value);
    }
  }

  private async runIds(sourceIds: string[]) {
    let error: SqError | undefined;
    for (const sourceId of sourceIds) {
      const cachedOutput = this.getItem(sourceId).output;
      if (cachedOutput) {
        // already ran
        if (!cachedOutput.ok) {
          error = cachedOutput.value;
        }
        continue;
      }

      if (error) {
        this.getItem(sourceId).failRun(error);
        continue;
      }

      await this.doLinkAndRun(sourceId);
      const output = this.getItem(sourceId).output;
      if (output && !output.ok) {
        error = output.value;
      }
    }
  }

  async runAll() {
    await this.runIds(this.getRunOrder());
  }

  // Deprecated; this method won't handle imports correctly.
  // Use `runWithImports` instead.
  async run(sourceId: string) {
    await this.runIds(Topology.getRunOrderFor(this, sourceId));
  }

  async loadImportsRecursively(
    initialSourceName: string,
    loadSource: (sourceId: string) => Promise<string>
  ) {
    const visited = new Set<string>();
    const inner = async (sourceName: string) => {
      if (visited.has(sourceName)) {
        // Oh we have already visited this source. There is an import cycle.
        throw new Error(`Cyclic import ${sourceName}`);
      }
      visited.add(sourceName);
      // Let's parse the imports and dive into them.
      this.parseImports(sourceName);
      const rImportIds = this.getImportIds(sourceName);
      if (!rImportIds.ok) {
        // Maybe there is an import syntax error.
        throw new Error(rImportIds.value.toString());
      }

      for (const newImportId of rImportIds.value) {
        // We have got one of the new imports.
        // Let's load it and add it to the project.
        const newSource = await loadSource(newImportId);
        this.setSource(newImportId, newSource);
        // The new source is loaded and added to the project.
        // Of course the new source might have imports too.
        // Let's recursively load them.
        await this.loadImportsRecursively(newImportId, loadSource);
      }
    };
    await inner(initialSourceName);
  }

  async runWithImports(
    sourceId: string,
    loadSource: (sourceId: string) => Promise<string>
  ) {
    await this.loadImportsRecursively(sourceId, loadSource);

    await this.run(sourceId);
  }

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

// ------------------------------------------------------------------------------------

// Shortcut for running a single piece of code without creating a project
export function evaluate(sourceCode: string): SqOutputResult {
  const project = SqProject.create();
  project.setSource("main", sourceCode);
  project.runAll();

  return project.getOutput("main");
}
