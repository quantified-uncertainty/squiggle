open Jest;
open Expect;

let json = Mathjs.parseMath("mm(normal(5,2), normal(10))");

describe("Shape", () => {
  describe("Parser", () => {
    test("", () => {
      let parsed1 = MathJsParser.parseMathjs(json);
      let parsed2 =
        (
          switch (parsed1 |> E.O.fmap(MathJsParser.toValue)) {
          | Some(Ok(r)) => Some(r)
          | _ => None
          }
        )
        |> E.O.fmap(Jstat.toString);
      Js.log2("YOYOYYO", parsed2);
      expect(1.0) |> toEqual(1.0);
    })
  })
});