open Jstat;

type arg =
  | Symbol(string)
  | Value(float)
  | Fn(fn)
  | Array(array(arg))
and fn = {
  name: string,
  args: array(arg),
};

let rec parseMathjs = (j: Js.Json.t) =>
  Json.Decode.(
    switch (field("mathjs", string, j)) {
    | "FunctionNode" =>
      let args = j |> field("args", array(parseMathjs));
      Some(
        Fn({
          name: j |> field("fn", field("name", string)),
          args: args |> E.A.O.concatSomes,
        }),
      );
    | "OperatorNode" =>
      let args = j |> field("args", array(parseMathjs));
      Some(
        Fn({
          name: j |> field("fn", string),
          args: args |> E.A.O.concatSomes,
        }),
      );
    | "ConstantNode" => Some(Value(field("value", Json.Decode.float, j)))
    | "ArrayNode" =>
      let items = field("items", array(parseMathjs), j);
      Some(Array(items |> E.A.O.concatSomes));
    | "SymbolNode" => Some(Symbol(field("name", string, j)))
    | n =>
      Js.log2("Couldn't parse mathjs node", j);
      None;
    }
  );

// let logHigh = math.log(high);
// let logLow = math.log(low);

// let mean = (math.mean(logHigh, logLow)).toFixed(3);
// let stdev = ((logHigh-logLow) / (2*1.645)).toFixed(3);

let normal: array(arg) => result(bigDist, string) =
  fun
  | [|Value(mean), Value(stdev)|] => Ok(`Dist(`Normal({mean, stdev})))
  | _ => Error("Wrong number of variables in normal distribution");

let lognormal: array(arg) => result(bigDist, string) =
  fun
  | [|Value(mu), Value(sigma)|] => Ok(`Dist(`Lognormal({mu, sigma})))
  | _ => Error("Wrong number of variables in lognormal distribution");

let to_: array(arg) => result(bigDist, string) =
  fun
  | [|Value(low), Value(high)|] => {
      let logLow = Js.Math.log(low);
      let logHigh = Js.Math.log(high);
      let mu = Functions.mean([|logLow, logHigh|]);
      let sigma = (logHigh -. logLow) /. (2.0 *. 1.645);
      Ok(`Dist(`Lognormal({mu, sigma})));
    }
  | _ => Error("Wrong number of variables in lognormal distribution");

let uniform: array(arg) => result(bigDist, string) =
  fun
  | [|Value(low), Value(high)|] => Ok(`Dist(`Uniform({low, high})))
  | _ => Error("Wrong number of variables in lognormal distribution");

let rec toValue = (r): result(bigDist, string) =>
  r
  |> (
    fun
    | Value(_) => Error("Top level can't be value")
    | Fn({name: "normal", args}) => normal(args)
    | Fn({name: "lognormal", args}) => lognormal(args)
    | Fn({name: "uniform", args}) => uniform(args)
    | Fn({name: "to", args}) => to_(args)
    | Fn({name: "mm", args}) => {
        let dists: array(dist) =
          args
          |> E.A.fmap(toValue)
          |> E.A.fmap(
               fun
               | Ok(`Dist(n)) => Some(n)
               | _ => None,
             )
          |> E.A.O.concatSomes;

        let inputs = dists |> E.A.fmap(r => (r, 1.0));
        Ok(`PointwiseCombination(inputs));
      }
    | Fn({name}) => Error(name ++ ": name not found")
    | Array(_) => Error("Array not valid as top level")
    | Symbol(_) => Error("Symbol not valid as top level")
  );

let fromString = str =>
  Mathjs.parseMath(str)
  |> E.R.bind(_, r =>
       switch (parseMathjs(r)) {
       | Some(r) => toValue(r)
       | None => Error("Second parse failed")
       }
     );