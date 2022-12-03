import { testToExpression } from "../helpers/reducerHelpers";

describe("Peggy void", () => {
  //literal
  testToExpression("()", "()", "()");
  testToExpression(
    "fn()=1",
    "fn = {|_| {1}}"
    // "@{fn: lambda(_=>internal code)}",
  );
  testToExpression("fn()=1; fn()", "fn = {|_| {1}}; (fn)(())", "1");
  testToExpression(
    "fn(a)=(); call fn(1)",
    "fn = {|a| {()}}; _ = {(fn)(1)}"
    // "@{_: (),fn: lambda(a=>internal code)}",
  );
});
