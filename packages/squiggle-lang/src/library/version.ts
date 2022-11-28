import * as Namespace from "../reducer/Namespace";
import { vString } from "../value";

export const makeVersionConstant = (): Namespace.Namespace => {
  return Namespace.fromArray([["System.version", vString("0.6.0")]]);
};
