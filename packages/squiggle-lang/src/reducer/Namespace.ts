import { ImmutableMap } from "../utility/immutableMap";
import { Value, valueToString, vRecord } from "../value";

/*
  Namespace is a flat mapping of names to Squiggle values.
  The full context of variables accessible to Squiggle is called "bindings"; see Bindings.ts module for details on it.
*/

export type Namespace = ImmutableMap<string, Value>;

export const make = (): Namespace => ImmutableMap();

export const get = (t: Namespace, id: string): Value | undefined => t.get(id);

export const set = (t: Namespace, id: string, value: Value): Namespace => {
  return t.set(id, value);
};

export const remove = (t: Namespace, id: string): Namespace => {
  return t.delete(id);
};

export const mergeFrom = (to: Namespace, from: Namespace): Namespace => {
  let result: Namespace = to;
  for (const [key, value] of from.entries()) {
    result = set(result, key, value);
  }
  return result;
};

export const mergeMany = (namespaces: Namespace[]): Namespace => {
  let result = make();
  for (const ns of namespaces) {
    result = mergeFrom(result, ns);
  }
  return result;
};

export const toString = (namespace: Namespace): string => {
  return [...namespace.entries()]
    .map(([key, value]) => `${key}: ${valueToString(value)}`)
    .join(",");
};

export const fromArray = (a: [string, Value][]): Namespace => {
  return ImmutableMap(a);
};

export const toRecord = (namespace: Namespace): Value => {
  return vRecord(namespace);
};
