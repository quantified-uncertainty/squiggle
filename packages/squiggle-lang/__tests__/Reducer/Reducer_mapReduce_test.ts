import { testEvalToBe } from "../helpers/reducerHelpers";

describe.skip("map reduce (sam)", () => {
  testEvalToBe("addone(x)=x+1; map(2, addone)", "Error???");
  testEvalToBe("addone(x)=x+1; map(2, {x: addone})", "Error???");
});

describe("map", () => {
  testEvalToBe("arr=[1,2,3]; map(arr, {|x| x*2})", "[2,4,6]");
});
