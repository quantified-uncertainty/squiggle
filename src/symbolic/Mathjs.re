[@bs.module "./MathjsWrapper.js"]
external parseMathExt: string => Js.Json.t = "parseMath";

let parseMath = (str: string): result(Js.Json.t, string) =>
  switch (parseMathExt(str)) {
  | exception (Js.Exn.Error(err)) =>
    Error(Js.Exn.message(err) |> E.O.default("MathJS Parse Error"))
  | exception _ => Error("MathJS Parse Error")
  | j => Ok(j)
  };