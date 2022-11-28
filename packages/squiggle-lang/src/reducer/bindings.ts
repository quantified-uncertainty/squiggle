/*
  Bindings describe the entire set of bound variables accessible to the squiggle code.
  Bindings objects are stored as linked lists of scopes:
  { localX: ..., localY: ... } <- { globalZ: ..., ... } <- { importedT: ..., ... } <- { stdlibFunction: ..., ... }
*/

import { Value } from "../value";
import * as Namespace from "./Namespace";

export type Bindings = {
  namespace: Namespace.Namespace;
  parent?: Bindings;
};

export const get = (t: Bindings, id: string): Value | undefined => {
  const local = Namespace.get(t.namespace, id);
  if (local !== undefined) {
    return local;
  }
  return t.parent ? get(t.parent, id) : undefined;
};

export const set = (t: Bindings, id: string, value: Value): Bindings => {
  return {
    ...t,
    namespace: Namespace.set(t.namespace, id, value),
  };
};

export const toString = (t: Bindings): string => {
  const pairs = Namespace.toString(t.namespace);

  return `{${pairs}}` + (t.parent ? `/ ${toString(t.parent)}` : "");
};

export const extend = (t: Bindings): Bindings => ({
  namespace: Namespace.make(),
  parent: t,
});

export const make = (): Bindings => ({
  namespace: Namespace.make(),
  parent: undefined,
});

export const removeResult = (t: Bindings): Bindings => ({
  ...t,
  namespace: Namespace.remove(t.namespace, "__result__"),
});

export const locals = (t: Bindings): Namespace.Namespace => t.namespace;

export const fromNamespace = (namespace: Namespace.Namespace): Bindings => ({
  namespace,
  parent: undefined,
});
