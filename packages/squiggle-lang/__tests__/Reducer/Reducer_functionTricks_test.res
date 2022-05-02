open Jest
open Reducer_TestHelpers

Skip.describe("function trics", () => {
  testEvalToBe("f(x,y)=x(y); f(f)", "????")    
  testEvalToBe("f(x)=x(y); f(f)", "????")    
  testEvalToBe("f(x)=x; f(f)", "????")    

  testEvalToBe("f(x,y)=x(y); f(z)", "????")
  testEvalToBe("f(x,y)=x(y); f(2)", "????")  //prevent js error
  testEvalToBe("f(x)=f(y)=2; f(2)", "????")  //prevent multiple assignment
  testEvalToBe("f(x)=x+1; g(x)=f(x)+1;g(2)", "????") //TODO: f is not found
  testEvalToBe("y=2;g(x)=y+1;g(2)", "????") //TODO : y is not found
  testEvalToBe("y=2;g(x)=inspect(y)+1", "????") //TODO : 666
  testEvalToBe("f(x,y)=x+y; f(1,2,3,4)", "????") //TODO : arity))
  testEvalToBe("f(x,y)=x+y; f(1)", "????") //TODO : arity))
})