import { Namespace, NamespaceMap } from "../reducer/bindings.js";
import { vString } from "../value/index.js";

export const makeVersionConstant = (): Namespace => {
  return NamespaceMap([["System.version", vString("0.6.0")]]);
};
