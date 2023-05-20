import { SqError } from "../SqError.js";
import { SqRecord } from "../SqRecord.js";
import { SqValue, wrapValue } from "../SqValue.js";
import * as Result from "../../utility/result.js";
import { SqValueLocation } from "../SqValueLocation.js";
import { defaultEnv, Env } from "../../dist/env.js";
import { IError } from "../../reducer/IError.js";
import * as Library from "../../library/index.js";
import { Value, vRecord } from "../../value/index.js";
import { createContext } from "../../reducer/Context.js";
import { Namespace, NamespaceMap } from "../../reducer/bindings.js";
import { ErrorMessage } from "../../reducer/ErrorMessage.js";

import { ImportBinding, ProjectItem } from "./ProjectItem.js";
import * as Topology from "./Topology.js";
import { Resolver } from "./Resolver.js";

function getNeedToRunError() {
  return new SqError(IError.fromMessage(ErrorMessage.needToRun()));
}

type Options = {
  resolver?: Resolver;
};

// TODO: Auto clean project based on topology
export class SqProject {
  private readonly items: Map<string, ProjectItem>;
  private stdLib: Namespace;
  private environment: Env;
  private resolver?: Resolver; // if not present, imports are forbidden

  constructor(options?: Options) {
    this.items = new Map();
    this.stdLib = Library.stdLib;
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

  getStdLib(): Namespace {
    return this.stdLib;
  }

  setStdLib(value: Namespace) {
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

  private touchSource_(sourceId: string): void {
    this.getItem(sourceId).touchSource();
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
    this.touchSource_(sourceId);
    this.touchDependents(sourceId);
  }

  setSource(sourceId: string, value: string) {
    if (this.items.has(sourceId)) {
      this.getItem(sourceId).setSource(value);
      this.touchDependents(sourceId);
    } else {
      this.items.set(sourceId, new ProjectItem({ sourceId, source: value }));
    }
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
      return Result.Error(getNeedToRunError());
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

  private getResultOption(sourceId: string) {
    return this.getItem(sourceId).result;
  }

  private getInternalResult(sourceId: string) {
    const result = this.getResultOption(sourceId);
    return result ?? Result.Error(getNeedToRunError());
  }

  getResult(sourceId: string) {
    return Result.fmap(this.getInternalResult(sourceId), (v) =>
      wrapValue(
        v,
        new SqValueLocation(this, sourceId, {
          root: "result",
          items: [],
        })
      )
    );
  }

  parseImports(sourceId: string): void {
    if (!this.resolver) {
      throw new Error("Imports are not supported when resolver is unset");
    }
    this.getItem(sourceId).parseImports(this.resolver);
  }

  private getRawBindings(sourceId: string): Namespace {
    // FIXME - should fail if bindings are not set
    return this.getItem(sourceId).bindings ?? NamespaceMap();
  }

  getBindings(sourceId: string): SqRecord {
    return new SqRecord(
      this.getRawBindings(sourceId),
      new SqValueLocation(this, sourceId, {
        root: "bindings",
        items: [],
      })
    );
  }

  private buildInitialBindings(
    sourceId: string
  ): Result.result<Namespace, SqError> {
    const continues = this.getContinues(sourceId);
    let namespace = NamespaceMap<string, Value>().merge(
      this.getStdLib(),
      ...continues.map((id) => this.getRawBindings(id)),
      ...continues.map((id) => {
        const result = this.getInternalResult(id);
        if (!result.ok) {
          throw result.value;
        }
        return NamespaceMap([["__result__", result.value]]);
      })
    );

    const rImports = this.getImports(sourceId) ?? Result.Ok([]); // FIXME - should just fail if imports are not parsed
    if (!rImports.ok) {
      // shouldn't happen, getImports fail only if parse failed
      return rImports;
    }
    for (const importBinding of rImports.value) {
      // TODO - check for collisions?
      namespace = namespace.set(
        importBinding.variable,
        vRecord(this.getRawBindings(importBinding.sourceId))
      );
    }
    return Result.Ok(namespace);
  }

  private doLinkAndRun(sourceId: string): void {
    const rBindings = this.buildInitialBindings(sourceId);

    if (rBindings.ok) {
      const context = createContext(rBindings.value, this.getEnvironment());

      this.getItem(sourceId).run(context);
    } else {
      // imports failed? or some other rare error
      this.getItem(sourceId).failRun(rBindings.value);
    }
  }

  private runIds(sourceIds: string[]) {
    let error: SqError | undefined;
    for (const sourceId of sourceIds) {
      const cachedResult = this.getResultOption(sourceId);
      if (cachedResult) {
        // already ran
        if (!cachedResult.ok) {
          error = cachedResult.value;
        }
        continue;
      }

      if (error) {
        this.getItem(sourceId).failRun(error);
        continue;
      }

      this.doLinkAndRun(sourceId);
      const result = this.getResultOption(sourceId);
      if (result && !result.ok) {
        error = result.value;
      }
    }
  }

  runAll() {
    this.runIds(this.getRunOrder());
  }

  // Deprecated; this method will ignore invalid imports.
  // Use `runWithImports` instead.
  run(sourceId: string) {
    this.runIds(Topology.getRunOrderFor(this, sourceId));
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

    this.run(sourceId);
  }
}

// ------------------------------------------------------------------------------------

// Shortcut for running a single piece of code without creating a project
export function evaluate(
  sourceCode: string
): [Result.result<SqValue, SqError>, SqRecord] {
  const project = SqProject.create();
  project.setSource("main", sourceCode);
  project.runAll();

  return [project.getResult("main"), project.getBindings("main")];
}
