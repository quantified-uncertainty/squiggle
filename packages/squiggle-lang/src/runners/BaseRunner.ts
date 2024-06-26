import { AST } from "../ast/types.js";
import { Env } from "../dists/env.js";
import { ICompileError, IRuntimeError } from "../errors/IError.js";
import { RunProfile } from "../reducer/RunProfile.js";
import { result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { VDict } from "../value/VDict.js";

export type RunParams = {
  // source is already parsed, because by this point `externals` already exists, which means that someone parsed the source code already
  // Note that `sourceId` can be restored from AST through `ast.location.source`.
  ast: AST;
  environment: Env;
  // should be previously resolved, usually by SqProject
  externals: VDict;
};

export type RunOutput = {
  result: Value;
  bindings: VDict;
  exports: VDict;
  profile: RunProfile | undefined;
};

export type RunResult = result<RunOutput, ICompileError | IRuntimeError>;

// Ideas for future methods:
// - streaming top-level values from `Program`
// - client-server architecture where output stays on on the server and can be queried (this might be difficult because server would have to manage object lifetimes somehow)
// - APIs for code -> AST and AST -> expression steps
export abstract class BaseRunner {
  abstract run(params: RunParams): Promise<RunResult>;
}
