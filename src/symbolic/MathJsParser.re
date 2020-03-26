module MathJsonToMathJsAdt = {
  type arg =
    | Symbol(string)
    | Value(float)
    | Fn(fn)
    | Array(array(arg))
    | Object(Js.Dict.t(arg))
  and fn = {
    name: string,
    args: array(arg),
  };

  let rec run = (j: Js.Json.t) =>
    Json.Decode.(
      switch (field("mathjs", string, j)) {
      | "FunctionNode" =>
        let args = j |> field("args", array(run));
        Some(
          Fn({
            name: j |> field("fn", field("name", string)),
            args: args |> E.A.O.concatSomes,
          }),
        );
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
      | n =>
        Js.log3("Couldn't parse mathjs node", j, n);
        None;
      }
    );
};

module MathAdtToDistDst = {
  open MathJsonToMathJsAdt;

  module MathAdtCleaner = {
    let transformWithSymbol = (f: float, s: string) =>
      switch (s) {
      | "K"
      | "k" => f *. 1000.
      | "M"
      | "m" => f *. 1000000.
      | "B"
      | "b" => f *. 1000000000.
      | "T"
      | "t" => f *. 1000000000000.
      | _ => f
      };

    let rec run =
      fun
      | Fn({name: "multiply", args: [|Value(f), Symbol(s)|]}) =>
        Value(transformWithSymbol(f, s))
      | Fn({name, args}) => Fn({name, args: args |> E.A.fmap(run)})
      | Array(args) => Array(args |> E.A.fmap(run))
      | Symbol(s) => Symbol(s)
      | Value(v) => Value(v)
      | Object(v) =>
        Object(
          v
          |> Js.Dict.entries
          |> E.A.fmap(((key, value)) => (key, run(value)))
          |> Js.Dict.fromArray,
        );
  };

  let normal: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(mean), Value(stdev)|] =>
      Ok(`Simple(`Normal({mean, stdev})))
    | _ => Error("Wrong number of variables in normal distribution");

  let lognormal: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(mu), Value(sigma)|] => Ok(`Simple(`Lognormal({mu, sigma})))
    | [|Object(o)|] => {
        let g = Js.Dict.get(o);
        switch (g("mean"), g("stdev"), g("mu"), g("sigma")) {
        | (Some(Value(mean)), Some(Value(stdev)), _, _) =>
          Ok(`Simple(SymbolicDist.Lognormal.fromMeanAndStdev(mean, stdev)))
        | (_, _, Some(Value(mu)), Some(Value(sigma))) =>
          Ok(`Simple(`Lognormal({mu, sigma})))
        | _ => Error("Lognormal distribution would need mean and stdev")
        };
      }
    | _ => Error("Wrong number of variables in lognormal distribution");

  let to_: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(high)|] when low < high => {
        Ok(`Simple(SymbolicDist.Lognormal.from90PercentCI(low, high)));
      }
    | [|Value(_), Value(_)|] =>
      Error("Low value must be less than high value.")
    | _ => Error("Wrong number of variables in lognormal distribution");

  let uniform: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(high)|] => Ok(`Simple(`Uniform({low, high})))
    | _ => Error("Wrong number of variables in lognormal distribution");

  let beta: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(alpha), Value(beta)|] => Ok(`Simple(`Beta({alpha, beta})))
    | _ => Error("Wrong number of variables in lognormal distribution");

  let exponential: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(rate)|] => Ok(`Simple(`Exponential({rate: rate})))
    | _ => Error("Wrong number of variables in Exponential distribution");

  let cauchy: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(local), Value(scale)|] =>
      Ok(`Simple(`Cauchy({local, scale})))
    | _ => Error("Wrong number of variables in cauchy distribution");

  let triangular: array(arg) => result(SymbolicDist.bigDist, string) =
    fun
    | [|Value(low), Value(medium), Value(high)|] =>
      Ok(`Simple(`Triangular({low, medium, high})))
    | _ => Error("Wrong number of variables in triangle distribution");

  let multiModal =
      (
        args: array(result(SymbolicDist.bigDist, string)),
        weights: array(float),
      ) => {
    let dists =
      args
      |> E.A.fmap(
           fun
           | Ok(`Simple(n)) => Some(n)
           | _ => None,
         )
      |> E.A.O.concatSomes;
    switch (dists |> E.A.length) {
    | 0 => Error("Multimodals need at least one input")
    | _ =>
      dists
      |> E.A.fmapi((index, item) =>
           (item, weights |> E.A.get(_, index) |> E.O.default(1.0))
         )
      |> (r => Ok(`PointwiseCombination(r)))
    };
  };

  let rec functionParser = (r): result(SymbolicDist.bigDist, string) =>
    r
    |> (
      fun
      | Fn({name: "normal", args}) => normal(args)
      | Fn({name: "lognormal", args}) => lognormal(args)
      | Fn({name: "uniform", args}) => uniform(args)
      | Fn({name: "beta", args}) => beta(args)
      | Fn({name: "to", args}) => to_(args)
      | Fn({name: "exponential", args}) => exponential(args)
      | Fn({name: "cauchy", args}) => cauchy(args)
      | Fn({name: "triangular", args}) => triangular(args)
      | Fn({name: "mm", args}) => {
          let dists = args |> E.A.fmap(functionParser);
          let weights =
            args
            |> E.A.last
            |> E.O.bind(
                 _,
                 fun
                 | Array(values) => Some(values)
                 | _ => None,
               )
            |> E.A.O.defaultEmpty
            |> E.A.fmap(
                 fun
                 | Value(r) => Some(r)
                 | _ => None,
               )
            |> E.A.O.concatSomes;
          multiModal(dists, weights);
        }
      | Fn({name}) => Error(name ++ ": function not supported")
      | _ => Error("This type not currently supported")
    );

  let topLevel = (r): result(SymbolicDist.bigDist, string) =>
    r
    |> (
      fun
      | Fn(_) => functionParser(r)
      | Value(_) => Error("Top level can't be value")
      | Array(_) => Error("Array not valid as top level")
      | Symbol(_) => Error("Symbol not valid as top level")
      | Object(_) => Error("Object not valid as top level")
    );

  let run = (r): result(SymbolicDist.bigDist, string) =>
    r |> MathAdtCleaner.run |> topLevel;
};

let fromString = str => {
  let mathJsToJson = Mathjs.parseMath(str);
  let mathJsParse =
    E.R.bind(mathJsToJson, r =>
      switch (MathJsonToMathJsAdt.run(r)) {
      | Some(r) => Ok(r)
      | None => Error("MathJsParse Error")
      }
    );
  let value = E.R.bind(mathJsParse, MathAdtToDistDst.run);
  Js.log4("fromString", mathJsToJson, mathJsParse, value);
  value;
};