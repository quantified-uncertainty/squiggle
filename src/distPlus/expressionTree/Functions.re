type node = ExpressionTypes.ExpressionTree.node;

let toOkSym = r => Ok(`SymbolicDist(r));

let twoFloats = (fn, n1: node, n2: node): result(node, string) =>
  switch (n1, n2) {
  | (`SymbolicDist(`Float(a)), `SymbolicDist(`Float(b))) => fn(a, b)
  | _ => Error("Variables have wrong type")
  };

let twoFloatsToOkSym = fn => twoFloats((f1, f2) => fn(f1, f2) |> toOkSym);

let apply2 = (fn, args): result(node, string) =>
  switch (args) {
  | [|a, b|] => fn(a, b)
  | _ => Error("Needs 2 args")
  };

let fnn = (name, args: array(node)) => {
  switch (name) {
  | "normal" => apply2(twoFloatsToOkSym(SymbolicDist.Normal.make), args)
  | "uniform" => apply2(twoFloatsToOkSym(SymbolicDist.Uniform.make), args)
  | "beta" => apply2(twoFloatsToOkSym(SymbolicDist.Beta.make), args)
  | "cauchy" => apply2(twoFloatsToOkSym(SymbolicDist.Cauchy.make), args)
  | _ => Error("Function not found")
  };
};
