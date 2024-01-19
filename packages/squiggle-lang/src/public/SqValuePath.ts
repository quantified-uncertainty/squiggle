import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";

export type PathItem =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "cellAddress"; value: { row: number; column: number } }
  | {
      type: "calculator";
    };

function pathItemIsEqual(a: PathItem, b: PathItem): boolean {
  if (a.type !== b.type) {
    return false;
  }
  switch (a.type) {
    case "string":
      return a.value === (b as { type: "string"; value: string }).value;
    case "number":
      return a.value === (b as { type: "number"; value: number }).value;
    case "cellAddress":
      return (
        a.value.row ===
          (b as { type: "cellAddress"; value: { row: number; column: number } })
            .value.row &&
        a.value.column ===
          (b as { type: "cellAddress"; value: { row: number; column: number } })
            .value.column
      );
    case "calculator":
      return true;
  }
}

export type Root = "result" | "bindings" | "imports" | "exports";

export class SqValuePath {
  public root: Root;
  public items: PathItem[];

  constructor(props: { root: Root; items: PathItem[] }) {
    this.root = props.root;
    this.items = props.items;
  }

  extend(item: PathItem) {
    return new SqValuePath({
      root: this.root,
      items: [...this.items, item],
    });
  }

  isEqual(other: SqValuePath) {
    if (this.items.length !== other.items.length) {
      return false;
    }
    for (let i = 0; i < this.items.length; i++) {
      if (pathItemIsEqual(this.items[i], other.items[i]) === false) {
        return false;
      }
    }
    return true;
  }

  static findByOffset({
    ast,
    offset,
  }: {
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
        case "Dict": {
          for (const pair of ast.elements) {
            if (
              !locationContains(
                {
                  source: ast.location.source,
                  start: pair.location.start,
                  end: pair.location.end,
                },
                offset
              )
            ) {
              continue;
            }

            if (
              pair.type === "KeyValue" &&
              pair.key.type === "String" // only string keys are supported
            ) {
              return [
                { type: "string", value: pair.key.value },
                ...findLoop(pair.value),
              ];
            } else if (pair.type === "Identifier") {
              return [{ type: "string", value: pair.value }]; // this is a final node, no need to findLoop recursively
            }
          }
          return [];
        }
        case "Array": {
          for (let i = 0; i < ast.elements.length; i++) {
            const element = ast.elements[i];
            if (locationContains(element.location, offset)) {
              return [{ type: "number", value: i }, ...findLoop(element)];
            }
          }
          return [];
        }
        case "LetStatement": {
          return [
            { type: "string", value: ast.variable.value },
            ...findLoop(ast.value),
          ];
        }
        case "DefunStatement": {
          return [
            { type: "string", value: ast.variable.value },
            ...findLoop(ast.value),
          ];
        }
        case "Block": {
          if (
            ast.statements.length === 1 &&
            ["Array", "Dict"].includes(ast.statements[0].type)
          ) {
            return findLoop(ast.statements[0]);
          }
        }
      }
      return [];
    };

    return new SqValuePath({
      root: "bindings", // not important, will probably be removed soon
      items: findLoop(ast),
    });
  }

  itemsAsValuePaths({ includeRoot = false }) {
    const root = new SqValuePath({
      root: this.root,
      items: [],
    });
    const leafs = this.items.map(
      (_, index) =>
        new SqValuePath({
          root: this.root,
          items: this.items.slice(0, index + 1),
        })
    );
    return includeRoot ? [root, ...leafs] : leafs;
  }

  isRoot() {
    return this.items.length === 0;
  }
}
