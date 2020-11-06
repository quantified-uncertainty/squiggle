module MathJsonToMathJsAdt = {
  type arg =
    | Symbol(string)
    | Value(float)
    | Fn(fn)
    | Array(array(arg))
    | Blocks(array(arg))
    | Object(Js.Dict.t(arg))
    | Assignment(arg, arg)
    | FunctionAssignment(fnAssignment)
  and fn = {
    name: string,
    args: array(arg),
  }
  and fnAssignment = {
    name: string,
    args: array(string),
    expression: arg,
  };

  let rec run = (j: Js.Json.t) =>
    Json.Decode.(
      switch (field("mathjs", string, j)) {
      | "FunctionNode" =>
        let args = j |> field("args", array(run));
        let name = j |> optional(field("fn", field("name", string)));
        name |> E.O.fmap(name => Fn({name, args: args |> E.A.O.concatSomes}));
      | "OperatorNode" =>
        let args = j |> field("args", array(run));
        Some(
          Fn({
            name: j |> field("fn", string),
            args: args |> E.A.O.concatSomes,
          }),
        );
      | "ConstantNode" =>
        optional(field("value", Json.Decode.float), j)
        |> E.O.fmap(r => Value(r))
      | "ParenthesisNode" => j |> field("content", run)
      | "ObjectNode" =>
        let properties = j |> field("properties", dict(run));
        Js.Dict.entries(properties)
        |> E.A.fmap(((key, value)) => value |> E.O.fmap(v => (key, v)))
        |> E.A.O.concatSomes
        |> Js.Dict.fromArray
        |> (r => Some(Object(r)));
      | "ArrayNode" =>
        let items = field("items", array(run), j);
        Some(Array(items |> E.A.O.concatSomes));
      | "SymbolNode" => Some(Symbol(field("name", string, j)))
      | "AssignmentNode" =>
        let object_ = j |> field("object", run);
        let value_ = j |> field("value", run);
        switch (object_, value_) {
        | (Some(o), Some(v)) => Some(Assignment(o, v))
        | _ => None
        };
      | "BlockNode" =>
        let block = r => r |> field("node", run);
        let args = j |> field("blocks", array(block)) |> E.A.O.concatSomes;
        Some(Blocks(args));
      | "FunctionAssignmentNode" =>
        let name = j |> field("name", string);
        let args = j |> field("params", array(field("name", string)));
        let expression = j |> field("expr", run);
        expression
        |> E.O.fmap(expression =>
             FunctionAssignment({name, args, expression})
           );
      | n =>
        Js.log3("Couldn't parse mathjs node", j, n);
        None;
      }
    );
};

module MathAdtToDistDst = {
  open MathJsonToMathJsAdt;

  let handleSymbol = sym => {
    Ok(`Symbol(sym));
  };

  // TODO: This only works on the top level, which needs to be refactored. Also, I think functions don't need to be done like this anymore.
  module MathAdtCleaner = {
    let transformWithSymbol = (f: float, s: string) =>
      switch (s) {
      | "K" => Some(f *. 1000.)
      | "M" => Some(f *. 1000000.)
      | "B" => Some(f *. 1000000000.)
      | "T" => Some(f *. 1000000000000.)
      | _ => None
      };
    let rec run =
      fun
      | Fn({name: "multiply", args: [|Value(f), Symbol(s)|]}) as doNothing =>
        transformWithSymbol(f, s)
        |> E.O.fmap(r => Value(r))
        |> E.O.default(doNothing)
      | Fn({name: "unaryMinus", args: [|Value(f)|]}) => Value((-1.0) *. f)
      | Fn({name, args}) => Fn({name, args: args |> E.A.fmap(run)})
      | Array(args) => Array(args |> E.A.fmap(run))
      | Symbol(s) => Symbol(s)
      | Value(v) => Value(v)
      | Blocks(args) => Blocks(args |> E.A.fmap(run))
      | Assignment(a, b) => Assignment(a, run(b))
      | FunctionAssignment(a) => FunctionAssignment(a)
      | Object(v) =>
        Object(
          v
          |> Js.Dict.entries
          |> E.A.fmap(((key, value)) => (key, run(value)))
          |> Js.Dict.fromArray,
        );
  };

  let lognormal = (args, parseArgs, nodeParser) =>
    switch (args) {
    | [|Object(o)|] =>
      let g = s =>
        Js.Dict.get(o, s)
        |> E.O.toResult("Variable was empty")
        |> E.R.bind(_, nodeParser);
      switch (g("mean"), g("stdev"), g("mu"), g("sigma")) {
      | (Ok(mean), Ok(stdev), _, _) =>
        Ok(`FunctionCall(("lognormalFromMeanAndStdDev", [|mean, stdev|])))
      | (_, _, Ok(mu), Ok(sigma)) =>
        Ok(`FunctionCall(("lognormal", [|mu, sigma|])))
      | _ =>
        Error(
          "Lognormal distribution needs either mean and stdev or mu and sigma",
        )
      };
    | _ =>
      parseArgs()
      |> E.R.fmap((args: array(ExpressionTypes.ExpressionTree.node)) =>
           `FunctionCall(("lognormal", args))
         )
    };

  //  Error("Dotwise exponentiation needs two operands")
  let operationParser =
      (
        name: string,
        args: result(array(ExpressionTypes.ExpressionTree.node), string),
      )
      : result(ExpressionTypes.ExpressionTree.node, string) => {
    let toOkAlgebraic = r => Ok(`AlgebraicCombination(r));
    let toOkPointwise = r => Ok(`PointwiseCombination(r));
    let toOkTruncate = r => Ok(`Truncate(r));
    args
    |> E.R.bind(_, args => {
         switch (name, args) {
         | ("add", [|l, r|]) => toOkAlgebraic((`Add, l, r))
         | ("add", _) => Error("Addition needs two operands")
         | ("unaryMinus", [|l|]) =>
           toOkAlgebraic((`Multiply, `SymbolicDist(`Float(-1.0)), l))
         | ("subtract", [|l, r|]) => toOkAlgebraic((`Subtract, l, r))
         | ("subtract", _) => Error("Subtraction needs two operands")
         | ("multiply", [|l, r|]) => toOkAlgebraic((`Multiply, l, r))
         | ("multiply", _) => Error("Multiplication needs two operands")
         | ("pow", [|l, r|]) => toOkAlgebraic((`Exponentiate, l, r))
         | ("pow", _) => Error("Exponentiation needs two operands")
         | ("dotMultiply", [|l, r|]) => toOkPointwise((`Multiply, l, r))
         | ("dotMultiply", _) =>
           Error("Dotwise multiplication needs two operands")
         | ("dotPow", [|l, r|]) => toOkPointwise((`Exponentiate, l, r))
         | ("dotPow", _) =>
           Error("Dotwise exponentiation needs two operands")
         | ("rightLogShift", [|l, r|]) => toOkPointwise((`Add, l, r))
         | ("rightLogShift", _) =>
           Error("Dotwise addition needs two operands")
         | ("divide", [|l, r|]) => toOkAlgebraic((`Divide, l, r))
         | ("divide", _) => Error("Division needs two operands")
         | ("leftTruncate", [|d, `SymbolicDist(`Float(lc))|]) =>
           toOkTruncate((Some(lc), None, d))
         | ("leftTruncate", _) =>
           Error(
             "leftTruncate needs two arguments: the expression and the cutoff",
           )
         | ("rightTruncate", [|d, `SymbolicDist(`Float(rc))|]) =>
           toOkTruncate((None, Some(rc), d))
         | ("rightTruncate", _) =>
           Error(
             "rightTruncate needs two arguments: the expression and the cutoff",
           )
         | (
             "truncate",
             [|d, `SymbolicDist(`Float(lc)), `SymbolicDist(`Float(rc))|],
           ) =>
           toOkTruncate((Some(lc), Some(rc), d))
         | ("truncate", _) =>
           Error(
             "truncate needs three arguments: the expression and both cutoffs",
           )
         | _ => Error("This type not currently supported")
         }
       });
  };

  let functionParser = (nodeParser, name, args) => {
    let parseArray = ags =>
      ags |> E.A.fmap(nodeParser) |> E.A.R.firstErrorOrOpen;
    let parseArgs = () => parseArray(args);
    switch (name) {
    | "lognormal" => lognormal(args, parseArgs, nodeParser)
    | "multimodal"
    | "mm" =>
      let weights =
        args
        |> E.A.last
        |> E.O.bind(
             _,
             fun
             | Array(values) => Some(parseArray(values))
             | _ => None,
           );
      let possibleDists =
        E.O.isSome(weights)
          ? Belt.Array.slice(args, ~offset=0, ~len=E.A.length(args) - 1)
          : args;
      let dists = parseArray(possibleDists);
      switch (weights, dists) {
      | (Some(Error(r)), _) => Error(r)
      | (_, Error(r)) => Error(r)
      | (None, Ok(dists)) => Ok(`FunctionCall(("multimodal", dists)))
      | (Some(Ok(r)), Ok(dists)) =>
        Ok(
          `FunctionCall(("multimodal", E.A.append([|`Array(r)|], dists))),
        )
      };
    | "add"
    | "subtract"
    | "multiply"
    | "unaryMinus"
    | "dotMultiply"
    | "dotPow"
    | "rightLogShift"
    | "divide"
    | "pow"
    | "leftTruncate"
    | "rightTruncate"
    | "truncate" => operationParser(name, parseArgs())
    | name =>
      parseArgs()
      |> E.R.fmap((args: array(ExpressionTypes.ExpressionTree.node)) =>
           `FunctionCall((name, args))
         )
    };
  };

  let rec nodeParser:
    MathJsonToMathJsAdt.arg =>
    result(ExpressionTypes.ExpressionTree.node, string) =
    fun
    | Value(f) => Ok(`SymbolicDist(`Float(f)))
    | Symbol(sym) => Ok(`Symbol(sym))
    | Fn({name, args}) => functionParser(nodeParser, name, args)
    | _ => {
        Error("This type not currently supported");
      };

  // | FunctionAssignment({name, args, expression}) => {
  //   let evaluatedExpression = run(expression);
  //   `Function(_ => Ok(evaluatedExpression));
  // }
  let rec topLevel = (r): result(ExpressionTypes.Program.program, string) =>
    switch (r) {
    | FunctionAssignment({name, args, expression}) =>
      switch (nodeParser(expression)) {
      | Ok(r) => Ok([|`Assignment((name, `Function((args, r))))|])
      | Error(r) => Error(r)
      }
    | Value(_) as r => nodeParser(r) |> E.R.fmap(r => [|`Expression(r)|])
    | Fn(_) as r => nodeParser(r) |> E.R.fmap(r => [|`Expression(r)|])
    | Array(_) => Error("Array not valid as top level")
    | Symbol(s) => handleSymbol(s) |> E.R.fmap(r => [|`Expression(r)|])
    | Object(_) => Error("Object not valid as top level")
    | Assignment(name, value) =>
      switch (name) {
      | Symbol(symbol) =>
        nodeParser(value) |> E.R.fmap(r => [|`Assignment((symbol, r))|])
      | _ => Error("Symbol not a string")
      }
    | Blocks(blocks) =>
      blocks
      |> E.A.fmap(b => topLevel(b))
      |> E.A.R.firstErrorOrOpen
      |> E.R.fmap(E.A.concatMany)
    };

  let run = (r): result(ExpressionTypes.Program.program, string) =>
    r |> MathAdtCleaner.run |> topLevel;
};

/* The MathJs parser doesn't support '.+' syntax, but we want it because it
   would make sense with '.*'. Our workaround is to change this to >>>, which is
   logShift in mathJS. We don't expect to use logShift anytime soon, so this tradeoff
   seems fine.
   */
let pointwiseToRightLogShift = Js.String.replaceByRe([%re "/\.\+/g"], ">>>");

let fromString2 = str => {
  /* We feed the user-typed string into Mathjs.parseMath,
       which returns a JSON with (hopefully) a single-element array.
       This array element is the top-level node of a nested-object tree
       representing the functions/arguments/values/etc. in the string.

       The function MathJsonToMathJsAdt then recursively unpacks this JSON into a typed data structure we can use.
       Inside of this function, MathAdtToDistDst is called whenever a distribution function is encountered.
     */
  let mathJsToJson = str |> pointwiseToRightLogShift |> Mathjs.parseMath;

  let mathJsParse =
    E.R.bind(mathJsToJson, r => {
      switch (MathJsonToMathJsAdt.run(r)) {
      | Some(r) => Ok(r)
      | None => Error("MathJsParse Error")
      }
    });

  let value = E.R.bind(mathJsParse, MathAdtToDistDst.run);
  Js.log2(mathJsParse, value);
  value;
};

let fromString = str => {
  fromString2(str);
};
