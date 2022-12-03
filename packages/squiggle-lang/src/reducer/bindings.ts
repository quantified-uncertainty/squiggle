/*
  Bindings describe the entire set of bound variables accessible to the squiggle code.
  Bindings objects are stored as linked lists of scopes:
  { localX: ..., localY: ... } <- { globalZ: ..., ... } <- { importedT: ..., ... } <- { stdlibFunction: ..., ... }
*/

import { Map as ImmutableMap } from "immutable";

import { Value } from "../value";

// generics are hard, maybe there's an easier way to express this and specialize ImmutableMap on export, but I couldn't find it in 5 minutes
type Namespace = ImmutableMap<string, Value>;
export { Namespace, ImmutableMap as NamespaceMap };

const namespaceToString = (namespace: Namespace): string => {
  return [...namespace.entries()]
    .map(([key, value]) => `${key}: ${value.toString()}`)
    .join(",");
};

export class Bindings {
  private constructor(
    private readonly namespace: Namespace,
    private readonly parent?: Bindings
  ) {}

  static make(): Bindings {
    return new Bindings(ImmutableMap(), undefined);
  }

  static fromNamespace(namespace: Namespace): Bindings {
    return new Bindings(namespace, undefined);
  }

  get(id: string): Value | undefined {
    return this.namespace.get(id) ?? this.parent?.get(id);
  }

  set(id: string, value: Value) {
    return new Bindings(this.namespace.set(id, value), this.parent);
  }

  toString(): string {
    const pairs = namespaceToString(this.namespace);

    return `{${pairs}}` + (this.parent ? `/ ${this.toString()}` : "");
  }

  extend(): Bindings {
    return new Bindings(ImmutableMap(), this);
  }

  extendWith(ns: Namespace): Bindings {
    return new Bindings(ns, this);
  }

  removeResult(): Bindings {
    return new Bindings(this.namespace.delete("__result__"), this.parent);
  }

  locals(): Namespace {
    return this.namespace;
  }
}
