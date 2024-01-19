import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";

export type RootPathItem = "result" | "bindings" | "imports" | "exports";

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

export class SqPathItem {
  private constructor(public value: PathItem) {}
  static fromString(str: string): SqPathItem {
    return new SqPathItem({ type: "string", value: str });
  }
  static fromNumber(num: number): SqPathItem {
    return new SqPathItem({ type: "number", value: num });
  }
  static fromCalculator(): SqPathItem {
    return new SqPathItem({ type: "calculator" });
  }
  static fromCellAddress(row: number, column: number): SqPathItem {
    return new SqPathItem({ type: "cellAddress", value: { row, column } });
  }

  get type() {
    return this.value.type;
  }

  isEqual(other: SqPathItem) {
    return pathItemIsEqual(this.value, other.value);
  }

  toDisplayString(): string {
    const item = this.value;
    switch (item.type) {
      case "string":
        return item.value;
      case "number":
        return String(item.value);
      case "cellAddress":
        return `Cell (${item.value.row},${item.value.column})`;
      case "calculator":
        return "calculator";
    }
  }

  serialize(): string {
    return JSON.stringify(this.value);
  }

  static deserialize(str: string): SqPathItem {
    const value = JSON.parse(str) as PathItem;
    return new SqPathItem(value);
  }
}

export class SqValuePath {
  public root: RootPathItem;
  public items: SqPathItem[];

  constructor(props: { root: RootPathItem; items: SqPathItem[] }) {
    this.root = props.root;
    this.items = props.items;
  }

  extend(item: SqPathItem) {
    return new SqValuePath({
      root: this.root,
      items: [...this.items, item],
    });
  }

  contains(smallerItem: SqValuePath) {
    if (this.items.length < smallerItem.items.length) {
      return false;
    }
    for (let i = 0; i < smallerItem.items.length; i++) {
      if (!this.items[i].isEqual(smallerItem.items[i])) {
        return false;
      }
    }
    return true;
  }

  isEqual(other: SqValuePath) {
    if (this.items.length !== other.items.length) {
      return false;
    }
    for (let i = 0; i < this.items.length; i++) {
      if (!this.items[i].isEqual(other.items[i])) {
        return false;
      }
    }
    return true;
  }

  serializeToString(): string {
    const pathObject = {
      root: this.root,
      items: this.items.map((item) => item.serialize()),
    };
    return JSON.stringify(pathObject);
  }

  static deserialize(str: string): SqValuePath {
    const parsed = JSON.parse(str);
    const items = parsed.items.map(SqPathItem.deserialize);
    return new SqValuePath({ root: parsed.root, items });
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

  static findByOffset({
    ast,
    offset,
  }: {
    ast: ASTNode;
    offset: number;
  }): SqValuePath | undefined {
    const findLoop = (ast: ASTNode): SqPathItem[] => {
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
                SqPathItem.fromString(pair.key.value),
                ...findLoop(pair.value),
              ];
            } else if (pair.type === "Identifier") {
              return [SqPathItem.fromString(pair.value)]; // this is a final node, no need to findLoop recursively
            }
          }
          return [];
        }
        case "Array": {
          for (let i = 0; i < ast.elements.length; i++) {
            const element = ast.elements[i];
            if (locationContains(element.location, offset)) {
              return [SqPathItem.fromNumber(i), ...findLoop(element)];
            }
          }
          return [];
        }
        case "LetStatement": {
          return [
            SqPathItem.fromString(ast.variable.value),
            ...findLoop(ast.value),
          ];
        }
        case "DefunStatement": {
          return [
            SqPathItem.fromString(ast.variable.value),
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
}
