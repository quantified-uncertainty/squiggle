open Jest
open Reducer_TestHelpers

describe("map reduce", () => {
  testEvalToBe("double(x)=2*x; arr=[1,2,3]; map(arr, double)", "Ok([2,4,6])")
  testEvalToBe("myadd(acc,x)=acc+x; arr=[1,2,3]; reduce(arr, 0, myadd)", "Ok(6)")
  testEvalToBe("change(acc,x)=acc*x+x; arr=[1,2,3]; reduce(arr, 0, change)", "Ok(15)")
  testEvalToBe("change(acc,x)=acc*x+x; arr=[1,2,3]; reduceReverse(arr, 0, change)", "Ok(9)")
  testEvalToBe("arr=[1,2,3]; reverse(arr)", "Ok([3,2,1])")
  testEvalToBe("check(x)=(x==2);arr=[1,2,3]; filter(arr,check)", "Ok([2])")
})

Skip.describe("map reduce (sam)", () => {
  testEvalToBe("addone(x)=x+1; map(2, addone)", "Error???")
  testEvalToBe("addone(x)=x+1; map(2, {x: addone})", "Error???")
})
