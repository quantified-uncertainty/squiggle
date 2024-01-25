import { SqValue, SqValuePath } from "@quri/squiggle-lang";

import { getChildrenValues, TraverseCalculatorEdge } from "./utils.js";

//We might want to bring this into the SquiggleLang library. The ``traverseCalculatorEdge`` part is awkward though.
class SqValueNode {
  constructor(
    public root: SqValue,
    public path: SqValuePath,
    public traverseCalculatorEdge: TraverseCalculatorEdge
  ) {}

  uid() {
    return this.path.uid();
  }

  isEqual(other: SqValueNode): boolean {
    return this.uid() === other.uid();
  }

  sqValue(): SqValue | undefined {
    return this.root.getSubvalueByPath(this.path, this.traverseCalculatorEdge);
  }

  parent() {
    const parentPath = this.path.parent();
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
      .filter((a): a is NonNullable<typeof a> => a !== undefined);
  }

  lastChild(): SqValueNode | undefined {
    return this.children().at(-1);
  }

  siblings() {
    return this.parent()?.children() ?? [];
  }

  prevSibling() {
    const index = this.getParentIndex();
    const isRootOrError = index === -1;
    const isFirstSibling = index === 0;
    if (isRootOrError || isFirstSibling) {
      return undefined;
    }
    return this.siblings()[index - 1];
  }

  nextSibling() {
    const index = this.getParentIndex();
    const isRootOrError = index === -1;
    const isLastSibling = index === this.siblings().length - 1;
    if (isRootOrError || isLastSibling) {
      return undefined;
    }
    return this.siblings()[index + 1];
  }

  getParentIndex() {
    return this.siblings().findIndex(this.isEqual);
  }
}

type GetIsCollapsed = (path: SqValuePath) => boolean;
type Params = { getIsCollapsed: GetIsCollapsed };

//This is split from SqValueNode because it handles more specialized logic for viewing open/closed nodes in the Viewer. It works for lists of nodes - we'll need new logic for tabular data.
export class SqListViewNode {
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
    return new SqListViewNode(node, { getIsCollapsed });
  }

  make(node: SqValueNode) {
    return new SqListViewNode(node, this.params);
  }

  // A helper function to make a node or undefined
  makeU(node: SqValueNode | undefined) {
    return node ? new SqListViewNode(node, this.params) : undefined;
  }

  value(): SqValue | undefined {
    return this.node.sqValue();
  }
  isRoot() {
    return this.node.path.isRoot();
  }
  parent() {
    return this.makeU(this.node.parent());
  }
  children() {
    return this.node.children().map(this.make);
  }
  lastChild() {
    return this.makeU(this.node.lastChild());
  }
  siblings() {
    return this.node.siblings().map(this.make);
  }
  prevSibling() {
    return this.makeU(this.node.prevSibling());
  }
  nextSibling() {
    return this.makeU(this.node.nextSibling());
  }
  private isCollapsed() {
    return this.params.getIsCollapsed(this.node.path);
  }

  private hasVisibleChildren() {
    return !this.isCollapsed() && this.children().length > 0;
  }

  private lastVisibleSubChild(): SqListViewNode | undefined {
    if (this.hasVisibleChildren()) {
      const lastChild = this.lastChild();
      return lastChild?.lastVisibleSubChild() || lastChild;
    } else {
      return this;
    }
  }

  private nextAvailableSibling(): SqListViewNode | undefined {
    return this.nextSibling() || this.parent()?.nextAvailableSibling();
  }

  next(): SqListViewNode | undefined {
    return this.hasVisibleChildren()
      ? this.children()[0]
      : this.nextAvailableSibling();
  }

  prev(): SqListViewNode | undefined {
    const prevSibling = this.prevSibling();
    return prevSibling ? prevSibling.lastVisibleSubChild() : this.parent();
  }
}
