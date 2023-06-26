import { LocationRange } from "peggy";
import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";
import { SqProject } from "./SqProject/index.js";
import * as Result from "../utility/result.js";
import { SqError } from "./SqError.js";

type PathItem = string | number;

export class SqValuePath {
  public project: SqProject;
  public sourceId: string;
  public root: "result" | "bindings";
  public items: PathItem[];

  constructor(props: {
    project: SqProject;
    sourceId: string;
    root: "result" | "bindings";
    items: PathItem[];
  }) {
    this.project = props.project;
    this.sourceId = props.sourceId;
    this.root = props.root;
    this.items = props.items;
  }

  extend(item: PathItem) {
    return new SqValuePath({
      project: this.project,
      sourceId: this.sourceId,
      root: this.root,
      items: [...this.items, item],
    });
  }

  static findByOffset({
    project,
    sourceId,
    ast,
    offset,
  }: {
    project: SqProject;
    sourceId: string;
    ast: ASTNode;
    offset: number;
  }): SqValuePath | undefined {
    const findLoop = (ast: ASTNode): PathItem[] => {
      switch (ast.type) {
        case "Program": {
          for (const statement of ast.statements) {
            if (locationContains(statement.location, offset)) {
              return findLoop(statement);
            }
          }
          return [];
        }
        case "Record": {
          for (const pair of ast.elements) {
            if (
              locationContains(
                {
                  source: ast.location.source,
                  start: pair.key.location.start,
                  end: pair.value.location.end,
                },
                offset
              ) &&
              pair.key.type === "String" // only string keys are supported
            ) {
              return [pair.key.value, ...findLoop(pair.value)];
            }
          }
          return [];
        }
        case "Array": {
          for (let i = 0; i < ast.elements.length; i++) {
            const element = ast.elements[i];
            if (locationContains(element.location, offset)) {
              return [i, ...findLoop(element)];
            }
          }
          return [];
        }
        case "LetStatement": {
          return [ast.variable.value, ...findLoop(ast.value)];
        }
        case "DefunStatement": {
          return [ast.variable.value, ...findLoop(ast.value)];
        }
        case "Block": {
          if (
            ast.statements.length === 1 &&
            ["Array", "Record"].includes(ast.statements[0].type)
          ) {
            return findLoop(ast.statements[0]);
          }
        }
      }
      return [];
    };

    return new SqValuePath({
      project,
      sourceId,
      root: "bindings", // not important, will probably be removed soon
      items: findLoop(ast),
    });
  }

  findLocation(): Result.result<LocationRange, SqError> {
    return this.project.findLocationByValuePath(this.sourceId, this);
  }

  itemsAsValuePaths() {
    return this.items.map(
      (_, index) =>
        new SqValuePath({
          project: this.project,
          sourceId: this.sourceId,
          root: this.root,
          items: this.items.slice(0, index + 1),
        })
    );
  }

  isRoot() {
    return this.items.length === 0;
  }
}
