import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";

export type PathItem =
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "cellAddress"; value: { row: number; column: number } };

export class SqValuePath {
  public root: "result" | "bindings";
  public items: PathItem[];

  constructor(props: { root: "result" | "bindings"; items: PathItem[] }) {
    this.root = props.root;
    this.items = props.items;
  }

  extend(item: PathItem) {
    return new SqValuePath({
      root: this.root,
      items: [...this.items, item],
    });
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
              return [
                { type: "string", value: pair.key.value },
                ...findLoop(pair.value),
              ];
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
            ["Array", "Record"].includes(ast.statements[0].type)
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

  itemsAsValuePaths() {
    return this.items.map(
      (_, index) =>
        new SqValuePath({
          root: this.root,
          items: this.items.slice(0, index + 1),
        })
    );
  }

  isRoot() {
    return this.items.length === 0;
  }
}
