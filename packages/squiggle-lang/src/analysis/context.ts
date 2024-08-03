import { Bindings } from "../reducer/Stack.js";
import { ImmutableMap } from "../utility/immutable.js";
import { KindTypedNode } from "./types.js";

export type AnalysisContext = {
  definitions: ImmutableMap<string, KindTypedNode<"IdentifierDefinition">>;
  stdlib: Bindings;
};
