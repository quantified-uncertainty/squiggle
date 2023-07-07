import { AST } from "../ast/parse.js";
import { findAstByPath } from "../ast/utils.js";
import { SqProject } from "./SqProject/index.js";
import { PathItem, SqValuePath } from "./SqValuePath.js";

export class SqValueContext {
  public project: SqProject;
  public sourceId: string;
  public ast: AST; // top-level AST
  public path: SqValuePath;

  constructor(props: {
    project: SqProject;
    sourceId: string;
    ast: AST;
    path: SqValuePath;
  }) {
    this.project = props.project;
    this.sourceId = props.sourceId;
    this.ast = props.ast;
    this.path = props.path;
  }

  extend(item: PathItem): SqValueContext {
    const path = this.path.extend(item);

    return new SqValueContext({
      project: this.project,
      sourceId: this.sourceId,
      ast: this.ast,
      path,
    });
  }

  findLocation() {
    return findAstByPath(this.ast, this.path.items).ast.location;
  }
}
