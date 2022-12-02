/*
  Bindings describe the entire set of bound variables accessible to the squiggle code.
  Bindings objects are stored as linked lists of scopes:
  { localX: ..., localY: ... } <- { globalZ: ..., ... } <- { importedT: ..., ... } <- { stdlibFunction: ..., ... }
*/

import { Value } from "../value";
import * as Namespace from "./Namespace";

export class Bindings {
  private constructor(
    private readonly namespace: Namespace.Namespace,
    private readonly parent?: Bindings
  ) {}

  static make(): Bindings {
    return new Bindings(Namespace.make(), undefined);
  }

  static fromNamespace(namespace: Namespace.Namespace): Bindings {
    return new Bindings(namespace, undefined);
  }

  get(id: string): Value | undefined {
    const local = Namespace.get(this.namespace, id);
    if (local !== undefined) {
      return local;
    }
    return this.parent?.get(id);
  }

  set(id: string, value: Value) {
    return new Bindings(Namespace.set(this.namespace, id, value), this.parent);
  }

  toString(): string {
    const pairs = Namespace.toString(this.namespace);

    return `{${pairs}}` + (this.parent ? `/ ${this.toString()}` : "");
  }

  extend(): Bindings {
    return new Bindings(Namespace.make(), this);
  }

  extendWith(ns: Namespace.Namespace): Bindings {
    return new Bindings(ns, this);
  }

  removeResult(): Bindings {
    return new Bindings(
      Namespace.remove(this.namespace, "__result__"),
      this.parent
    );
  }

  locals(): Namespace.Namespace {
    return this.namespace;
  }
}
