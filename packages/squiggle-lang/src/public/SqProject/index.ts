import { SqError } from "../SqError";
import { SqRecord } from "../SqRecord";
import { SqValue, wrapValue } from "../SqValue";
import * as Result from "../../utility/result";
import { SqValueLocation } from "../SqValueLocation";
import * as ProjectItem from "./ProjectItem";
import * as Topology from "./Topology";
import { Resolver } from "./Resolver";
import { defaultEnv, Env } from "../../dist/env";
import { IError } from "../../reducer/IError";
import * as Library from "../../library";
import { Value, vRecord } from "../../value";
import { createContext } from "../../reducer/Context";
import { Namespace, NamespaceMap } from "../../reducer/bindings";
import { ErrorMessage } from "../../reducer/ErrorMessage";

type Options = {
  resolver?: Resolver;
};

// TODO: Auto clean project based on topology
export class SqProject {
  private readonly items: Map<string, ProjectItem.ProjectItem>;
  private stdLib: Namespace;
  private environment: Env;
  private previousRunOrder: string[];
  private resolver?: Resolver; // if not present, includes are forbidden

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

  getIncludes(sourceId: string): Result.result<string[], SqError> {
    return this.getItem(sourceId).includes;
  }

  // returns all "direct" includes: explicit continues and direct "include as *"
  getPastChain(sourceId: string): string[] {
    return ProjectItem.getPastChain(this.getItem(sourceId));
  }

  getIncludesAsVariables(sourceId: string): [string, string][] {
    return this.getItem(sourceId).includeAsVariables;
  }

  getDirectIncludes(sourceId: string): string[] {
    return this.getItem(sourceId).directIncludes;
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

  parseIncludes(sourceId: string): void {
    if (!this.resolver) {
      throw new Error("Includes are not supported when resolver is unset");
    }
    const newItem = ProjectItem.parseIncludes(
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

  private linkDependencies(sourceId: string): Namespace {
    const pastChain = this.getPastChain(sourceId);
    const namespace = NamespaceMap<string, Value>().merge(
      this.getStdLib(),
      ...pastChain.map((id) => this.getRawBindings(id)),
      ...pastChain.map((id) => {
        const result = this.getInternalResult(id);
        if (!result.ok) {
          throw result.value;
        }
        return NamespaceMap([["__result__", result.value]]);
      })
    );

    const includesAsVariables = this.getIncludesAsVariables(sourceId);
    return includesAsVariables.reduce(
      (acc, [variable, includeFile]) =>
        acc.set(variable, vRecord(this.getRawBindings(includeFile))),
      namespace
    );
  }

  private doLinkAndRun(sourceId: string): void {
    const context = createContext(
      this.linkDependencies(sourceId),
      this.getEnvironment()
    );
    const newItem = ProjectItem.run(this.getItem(sourceId), context);
    // console.log("after run " + newItem.bindings->Reducer_Bindings.toString)
    this.setItem(sourceId, newItem);
  }

  private runFromRunOrder(runOrder: string[]) {
    let error: SqError | undefined;
    for (const sourceId of runOrder) {
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
    this.runFromRunOrder(this.getRunOrder());
  }

  run(sourceId: string) {
    this.runFromRunOrder(Topology.getRunOrderFor(this, sourceId));
  }
}

// ------------------------------------------------------------------------------------

// Shortcut for running a single piece of code without creating a project
export const evaluate = (
  sourceCode: string
): [Result.result<SqValue, SqError>, SqRecord] => {
  let project = SqProject.create();
  project.setSource("main", sourceCode);
  project.runAll();

  return [project.getResult("main"), project.getBindings("main")];
};
