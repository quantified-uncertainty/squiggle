open Jest
open Reducer_Peggy_TestHelpers

// Note: these tests aren't useful anymore since outer block macro got deleted.
// Probably can be removed or folded into other Peggy tests.
describe("Peggy Outer Block", () => {
  testToExpression("1", "1", ~v="1", ())
  testToExpression("x=1", "x = {1}", ~v="()", ())
  testToExpression("x=1; y=2", "x = {1}; y = {2}", ~v="()", ())
  testToExpression("x=1; 2", "x = {1}; 2", ~v="2", ())
  testToExpression("x={a=1; a}; x", "x = {a = {1}; a}; x", ~v="1", ())
})
