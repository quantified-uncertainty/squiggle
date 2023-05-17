import { SqError } from "../SqError.js";
import { SqRecord } from "../SqRecord.js";
import { SqValue, wrapValue } from "../SqValue.js";
import * as Result from "../../utility/result.js";
import { SqValueLocation } from "../SqValueLocation.js";
import * as ProjectItem from "./ProjectItem.js";
import * as Topology from "./Topology.js";
import { Resolver } from "./Resolver.js";
import { defaultEnv, Env } from "../../dist/env.js";
import { IError } from "../../reducer/IError.js";
import * as Library from "../../library/index.js";
import { Value, vRecord } from "../../value/index.js";
import { createContext } from "../../reducer/Context.js";
import { Namespace, NamespaceMap } from "../../reducer/bindings.js";
import { ErrorMessage } from "../../reducer/ErrorMessage.js";

type Options = {
  resolver?: Resolver;
};

// TODO: Auto clean project based on topology
export class SqProject {
  private readonly items: Map<string, ProjectItem.ProjectItem>;
  private stdLib: Namespace;
  private environment: Env;
  private previousRunOrder: string[];
  private resolver?: Resolver; // if not present, imports are forbidden

  constructor(options?: Options) {
    this.items = new Map();
    this.stdLib = Library.stdLib;
    this.environment = defaultEnv;
    this.previousRunOrder = [];
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

  private getItem(sourceId: string): ProjectItem.ProjectItem {
    return this.items.get(sourceId) ?? ProjectItem.emptyItem(sourceId);
  }

  private setItem(sourceId: string, item: ProjectItem.ProjectItem) {
    this.items.set(sourceId, item);
  }

  private touchSource_(sourceId: string): void {
    const item = this.getItem(sourceId);
    const newItem = ProjectItem.touchSource(item);
    this.setItem(sourceId, newItem);
  }

  private touchDependents(sourceId: string) {
    Topology.getDependents(this, sourceId).forEach((id) =>
      this.touchSource_(id)
    );
  }

  getImmediateDependencies(sourceId: string): string[] {
    return ProjectItem.getImmediateDependencies(this.getItem(sourceId));
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

  getDependencies(sourceId: string) {
    return Topology.getDependencies(this, sourceId);
  }

  private handleNewTopology() {
    const previousRunOrder = this.previousRunOrder;
    const currentRunOrder = this.getRunOrder();
    const diff = Topology.runOrderDiff(currentRunOrder, previousRunOrder);
    diff.forEach((id) => this.touchSource(id));
    this.previousRunOrder = currentRunOrder;
  }

  touchSource(sourceId: string) {
    this.touchSource_(sourceId);
    this.touchDependents(sourceId);
  }

  setSource(sourceId: string, value: string) {
    const newItem = ProjectItem.setSource(this.getItem(sourceId), value);
    this.setItem(sourceId, newItem);
    this.touchDependents(sourceId);
  }

  removeSource(sourceId: string) {
    this.items.delete(sourceId);
  }

  getSource(sourceId: string) {
    return this.items.get(sourceId)?.source;
  }

  clean(sourceId: string) {
    const newItem = ProjectItem.clean(this.getItem(sourceId));
    this.setItem(sourceId, newItem);
  }

  cleanAll() {
    this.getSourceIds().forEach((id) => this.clean(id));
  }

  cleanResults(sourceId: string) {
    const newItem = ProjectItem.cleanResults(this.getItem(sourceId));
    this.setItem(sourceId, newItem);
  }

  cleanAllResults() {
    this.getSourceIds().forEach((id) => this.cleanResults(id));
  }

  getImportIds(sourceId: string): Result.result<string[], SqError> {
    return Result.fmap(this.getItem(sourceId).imports, (imports) =>
      imports.map((i) => i.sourceId)
    );
  }

  getImports(
    sourceId: string
  ): Result.result<ProjectItem.ImportBinding[], SqError> {
    return this.getItem(sourceId).imports;
  }

  getContinues(sourceId: string): string[] {
    return this.getItem(sourceId).continues;
  }

  setContinues(sourceId: string, continues: string[]): void {
    const newItem = ProjectItem.setContinues(this.getItem(sourceId), continues);
    this.setItem(sourceId, newItem);
    this.handleNewTopology();
  }

  private getResultOption(sourceId: string) {
    return this.getItem(sourceId).result;
  }

  private getInternalResult(sourceId: string) {
    const result = this.getResultOption(sourceId);
    return (
      result ??
      Result.Error(new SqError(IError.fromMessage(ErrorMessage.needToRun())))
    );
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

  private setResult(
    sourceId: string,
    value: Result.result<Value, SqError>
  ): void {
    const newItem = ProjectItem.setResult(this.getItem(sourceId), value);
    this.setItem(sourceId, newItem);
  }

  parseImports(sourceId: string): void {
    if (!this.resolver) {
      throw new Error("Imports are not supported when resolver is unset");
    }
    const newItem = ProjectItem.parseImports(
      this.getItem(sourceId),
      this.resolver
    );
    this.setItem(sourceId, newItem);
    this.handleNewTopology();
  }

  rawParse(sourceId: string): void {
    const newItem = ProjectItem.rawParse(this.getItem(sourceId));
    this.setItem(sourceId, newItem);
  }

  private getRawBindings(sourceId: string): Namespace {
    return this.getItem(sourceId).bindings;
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

    const rImports = this.getImports(sourceId);
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
    if (!rBindings.ok) {
      return; // imports failed, nothing to do here
    }
    const context = createContext(rBindings.value, this.getEnvironment());

    const newItem = ProjectItem.run(this.getItem(sourceId), context);
    this.setItem(sourceId, newItem);
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
        this.setResult(sourceId, Result.Error(error));
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

  run(sourceId: string) {
    this.runIds(Topology.getRunOrderFor(this, sourceId));
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
