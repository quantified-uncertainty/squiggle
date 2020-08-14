type node = ExpressionTypes.ExpressionTree.node;

let toOkSym = r => Ok(`SymbolicDist(r));
let getFloat = ExpressionTypes.ExpressionTree.getFloat;
let fnn =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      name,
      args: array(node),
    ) => {
  let trySomeFns =
    TypeSystem.getAndRun(Fns.functions, name, evaluationParams, args);
  switch (trySomeFns) {
  | Some(r) => r
  | None =>
    switch (
      name,
      ExpressionTypes.ExpressionTree.Environment.get(
        evaluationParams.environment,
        name,
      ),
    ) {
    | (_, Some(`Function(argNames, tt))) =>
      PTypes.Function.run(evaluationParams, args, (argNames, tt))
    | ("mm", _)
    | ("multimodal", _) =>
      switch (args |> E.A.to_list) {
      | [`Array(weights), ...dists] =>
        let withWeights =
          dists
          |> E.L.toArray
          |> E.A.fmapi((index, t) => {
               let w =
                 weights
                 |> E.A.get(_, index)
                 |> E.O.bind(_, getFloat)
                 |> E.O.default(1.0);
               (t, w);
             });
        Ok(`MultiModal(withWeights));
      | dists when E.L.length(dists) > 0 =>
        Ok(`MultiModal(dists |> E.L.toArray |> E.A.fmap(r => (r, 1.0))))
      | _ => Error("Needs at least one distribution")
      }
    | _ => Error("Function " ++ name ++ " not found")
    }
  };
};
