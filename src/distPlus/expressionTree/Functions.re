type node = ExpressionTypes.ExpressionTree.node;

let toOkSym = r => Ok(`SymbolicDist(r));
let getFloat = ExpressionTypes.ExpressionTree.getFloat;
let fnn =
    (
      evaluationParams: ExpressionTypes.ExpressionTree.evaluationParams,
      name,
      args: array(node),
    ) => {
  // let foundFn =
  // TypeSystem.Function.Ts.findByName(Fns.functions, name) |> E.O.toResult("Function " ++ name ++ " not found");
  // let ran = foundFn |> E.R.bind(_,TypeSystem.Function.T.run(evaluationParams,args))
    
  let foundFn =
    TypeSystem.Function.Ts.findByNameAndRun(Fns.functions, name, evaluationParams, args);
  switch (foundFn) {
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
      Js.log("Fundction found: " ++ name);
      PTypes.Function.run(evaluationParams, args, (argNames, tt))
    | _ => Error("Function " ++ name ++ " not found")
    }
  };
};
