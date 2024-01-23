import { SqValue, SqValuePath } from "@quri/squiggle-lang";

export function getChildrenValues(value: SqValue): SqValue[] {
  switch (value.tag) {
    case "Array":
      return value.value.getValues();
    case "Dict":
      return value.value.entries().map((a) => a[1]);
    default: {
      return [];
    }
  }
}

type TraverseCalculatorEdge = (path: SqValuePath) => SqValue | undefined;

class SqValueNode {
  constructor(
    public root: SqValue,
    public path: SqValuePath,
    public traverseCalculatorEdge: TraverseCalculatorEdge
  ) {}

  uid() {
    return this.path.uid();
  }

  isEqual = (other: SqValueNode) => {
    return this.uid() === other.uid();
  };

  sqValue(): SqValue | undefined {
    return this.root.getSubvalueByPath(this.path, this.traverseCalculatorEdge);
  }

  parent() {
    const parentPath = this.path.parent();
    if (!parentPath) {
      return undefined;
    }
    return parentPath
      ? new SqValueNode(this.root, parentPath, this.traverseCalculatorEdge)
      : undefined;
  }

  children() {
    const value = this.sqValue();
    if (!value) {
      return [];
    }
    return getChildrenValues(value)
      .map((childValue) => {
        const path = childValue.context?.path;
        return path
          ? new SqValueNode(this.root, path, this.traverseCalculatorEdge)
          : undefined;
      })
      .filter((a) => a !== undefined) as SqValueNode[];
  }

  lastChild(): SqValueNode | undefined {
    return this.children().at(-1);
  }

  siblings() {
    return this.parent()?.children() || [];
  }

  getParentIndex() {
    const siblings = this.siblings();
    return siblings.findIndex(this.isEqual);
  }
}

type GetIsCollapsed = (path: SqValuePath) => boolean;
type Params = { getIsCollapsed: GetIsCollapsed };

export class SqViewNode {
  constructor(
    public node: SqValueNode,
    public params: Params
  ) {
    this.make = this.make.bind(this);
  }

  static make(
    root: SqValue,
    path: SqValuePath,
    traverseCalculatorEdge: TraverseCalculatorEdge,
    getIsCollapsed: GetIsCollapsed
  ) {
    const node = new SqValueNode(root, path, traverseCalculatorEdge);
    return new SqViewNode(node, { getIsCollapsed });
  }

  make(node: SqValueNode) {
    return new SqViewNode(node, this.params);
  }

  value(): SqValue | undefined {
    return this.node.sqValue();
  }

  isRoot() {
    return this.node.path.isRoot();
  }

  parent() {
    const parent = this.node.parent();
    return parent ? this.make(parent) : undefined;
  }

  children() {
    return this.node.children().map(this.make);
  }
  lastChild() {
    return this.make(this.node.lastChild()!);
  }
  siblings() {
    return this.node.siblings().map(this.make);
  }

  prevSibling() {
    const index = this.node.getParentIndex();
    const isRootOrError = index === -1;
    const isFirstSibling = index === 0;
    if (isRootOrError || isFirstSibling) {
      return undefined;
    }
    return this.siblings()[index - 1];
  }

  nextSibling() {
    const index = this.node.getParentIndex();
    const isRootOrError = index === -1;
    const isLastSibling = index === this.node.siblings().length - 1;
    if (isRootOrError || isLastSibling) {
      return undefined;
    }
    return this.siblings()[index + 1];
  }

  private isCollapsed() {
    return this.params.getIsCollapsed(this.node.path);
  }

  private childrenAreVisible() {
    return !this.isCollapsed();
  }

  private lastVisibleSubChild(): SqViewNode | undefined {
    if (this.children.length > 0 && this.childrenAreVisible()) {
      const lastChild = this.lastChild();
      return lastChild?.lastVisibleSubChild() || lastChild;
    } else {
      return this;
    }
  }

  private nextAvailableSibling(): SqViewNode | undefined {
    return this.nextSibling() || this.parent();
  }

  next(): SqViewNode | undefined {
    return this.children().length > 0 && !this.isCollapsed()
      ? this.children()[0]
      : this.nextAvailableSibling();
  }

  prev(): SqViewNode | undefined {
    const prevSibling = this.prevSibling();
    if (!prevSibling) {
      return this.parent();
    }
    return prevSibling.lastVisibleSubChild();
  }
}
