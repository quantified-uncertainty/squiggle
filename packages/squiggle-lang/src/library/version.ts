import { Namespace, NamespaceMap } from "../reducer/bindings";
import { vString } from "../value";

export const makeVersionConstant = (): Namespace => {
  return NamespaceMap([["System.version", vString("0.6.0")]]);
};
