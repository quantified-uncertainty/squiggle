import { SqProject } from "./SqProject";

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
}
