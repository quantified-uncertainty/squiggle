import { ASTNode } from "../ast/parse.js";
import { locationContains } from "../ast/utils.js";
import { SqProject } from "./SqProject/index.js";

type PathItem = string | number;

type SqValuePath = {
  root: "result" | "bindings";
  items: PathItem[];
};

export class SqValueLocation {
  constructor(
    public project: SqProject,
    public sourceId: string,
    public path: SqValuePath
  ) {}

  extend(item: PathItem) {
    return new SqValueLocation(this.project, this.sourceId, {
      root: this.path.root,
      items: [...this.path.items, item],
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
  }): SqValueLocation | undefined {
    const findLoop = (ast: ASTNode): PathItem[] => {
      console.log("findLoop", ast);
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

    const path = {
      root: "bindings", // not important, will probably be removed soon
      items: findLoop(ast),
    } satisfies SqValuePath;

    return new SqValueLocation(project, sourceId, path);
  }
}
