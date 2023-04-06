import { testToExpression } from "../helpers/reducerHelpers.js";

describe("Peggy void", () => {
  //literal
  testToExpression("()", "()", "()");
  testToExpression("fn()=1", "fn = {|| {1}}");
  testToExpression("fn()=1; fn()", "fn = {|| {1}}; (fn)()", "1");
  testToExpression("fn(a)=(); call fn(1)", "fn = {|a| {()}}; _ = {(fn)(1)}");
});
