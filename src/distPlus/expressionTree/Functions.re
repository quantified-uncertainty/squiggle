type node = ExpressionTypes.ExpressionTree.node;

let toOkSym = r => Ok(`SymbolicDist(r));

let twoFloats = (fn, n1: node, n2: node): result(node, string) =>
  switch (n1, n2) {
  | (`SymbolicDist(`Float(a)), `SymbolicDist(`Float(b))) => fn(a, b)
  | _ => Error("Variables have wrong type")
  };

let threeFloats = (fn, n1: node, n2: node, n3: node): result(node, string) =>
  switch (n1, n2, n3) {
  | (
      `SymbolicDist(`Float(a)),
      `SymbolicDist(`Float(b)),
      `SymbolicDist(`Float(c)),
    ) =>
    fn(a, b, c)
  | _ => Error("Variables have wrong type")
  };

let twoFloatsToOkSym = fn => twoFloats((f1, f2) => fn(f1, f2) |> toOkSym);

let threeFloats = fn => threeFloats((f1, f2, f3) => fn(f1, f2, f3));

let apply2 = (fn, args): result(node, string) =>
  switch (args) {
  | [|a, b|] => fn(a, b)
  | _ => Error("Needs 2 args")
  };

let apply3 = (fn, args: array(node)): result(node, string) =>
  switch (args) {
  | [|a, b, c|] => fn(a, b, c)
  | _ => Error("Needs 3 args")
  };

let to_: array(node) => result(node, string) =
  fun
  | [|`SymbolicDist(`Float(low)), `SymbolicDist(`Float(high))|]
      when low <= 0.0 && low < high => {
      Ok(`SymbolicDist(SymbolicDist.Normal.from90PercentCI(low, high)));
    }
  | [|`SymbolicDist(`Float(low)), `SymbolicDist(`Float(high))|]
      when low < high => {
      Ok(`SymbolicDist(SymbolicDist.Lognormal.from90PercentCI(low, high)));
    }
  | [|`SymbolicDist(`Float(_)), `SymbolicDist(_)|] =>
    Error("Low value must be less than high value.")
  | _ => Error("Requires 2 variables");

let fnn = (name, args: array(node)) => {
  switch (name) {
  | "normal" => apply2(twoFloatsToOkSym(SymbolicDist.Normal.make), args)
  | "uniform" => apply2(twoFloatsToOkSym(SymbolicDist.Uniform.make), args)
  | "beta" => apply2(twoFloatsToOkSym(SymbolicDist.Beta.make), args)
  | "cauchy" => apply2(twoFloatsToOkSym(SymbolicDist.Cauchy.make), args)
  | "lognormal" => apply2(twoFloatsToOkSym(SymbolicDist.Lognormal.make), args)
  | "lognormalFromMeanAndStdDev" => apply2(twoFloatsToOkSym(SymbolicDist.Lognormal.fromMeanAndStdev), args)
  | "exponential" => 
    switch (args) {
    | [|
        `SymbolicDist(`Float(a)),
      |] =>
      Ok(`SymbolicDist(SymbolicDist.Exponential.make(a)));
    | _ => Error("Needs 3 valid arguments")
    }
  | "triangular" =>
    switch (args) {
    | [|
        `SymbolicDist(`Float(a)),
        `SymbolicDist(`Float(b)),
        `SymbolicDist(`Float(c)),
      |] =>
      SymbolicDist.Triangular.make(a, b, c)
      |> E.R.fmap(r => `SymbolicDist(r))
    | _ => Error("Needs 3 valid arguments")
    }
  | "to" => to_(args)
  | _ => Error("Function not found")
  };
};
