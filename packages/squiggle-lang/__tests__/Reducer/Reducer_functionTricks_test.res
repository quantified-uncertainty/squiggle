open Jest
open Reducer_TestHelpers

describe("Arity check", () => {
  testEvalToBe("f(x,y) = x + y; f(1,2)", "Ok(3)")
  testEvalToBe(
    "f(x,y) = x + y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y) = x + y; f(1,2,3)",
    "Error(2 arguments expected. Instead 3 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x+y; f(1,2,3,4)",
    "Error(2 arguments expected. Instead 4 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x+y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe(
    "f(x,y)=x(y); f(f)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
  testEvalToBe("f(x)=x; f(f)", "Ok(lambda(x=>internal code))")
  testEvalToBe(
    "f(x,y)=x(y); f(z)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)",
  )
})

describe("function trics", () => {
  testEvalToBe("f(x)=x(y); f(f)", "Error(y is not defined)")
  testEvalToBe("f(x)=x; f(f)", "Ok(lambda(x=>internal code))")
  testEvalToBe("f(x)=x(y); f(z)", "Error(y is not defined)")
  MySkip.testEvalToBe("f(x)=x(y); f(2)", "????") //prevent js error
  MySkip.testEvalToBe("f(x)=f(y)=2; f(2)", "????") //prevent multiple assignment
  MySkip.testEvalToBe("f(x)=x+1; g(x)=f(x)+1;g(2)", "????") //TODO: f is not found
  MySkip.testEvalToBe("y=2;g(x)=y+1;g(2)", "????") //TODO : y is not found
  MySkip.testEvalToBe("y=2;g(x)=inspect(y)+1", "????") //TODO : 666
})
