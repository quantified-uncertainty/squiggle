import {
  MySkip,
  testEvalError,
  testEvalToBe,
  testToExpression,
} from "../helpers/reducerHelpers.js";

describe("Arity check", () => {
  testEvalToBe("f(x,y) = x + y; f(1,2)", "3");
  testEvalToBe(
    "f(x,y) = x + y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)"
  );
  testEvalToBe(
    "f(x,y) = x + y; f(1,2,3)",
    "Error(2 arguments expected. Instead 3 argument(s) were passed.)"
  );
  testEvalToBe(
    "f(x,y)=x+y; f(1,2,3,4)",
    "Error(2 arguments expected. Instead 4 argument(s) were passed.)"
  );
  testEvalToBe(
    "f(x,y)=x+y; f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)"
  );
  testEvalToBe(
    "f(x,y)=x(y); f(f)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)"
  );
  testEvalToBe("f(x)=x; f(f)", "lambda(x=>internal code)");
  testEvalToBe(
    "f(x,y)=x(y); f(1)",
    "Error(2 arguments expected. Instead 1 argument(s) were passed.)"
  );
});

describe("symbol not defined", () => {
  testEvalToBe("f(x)=x(y); f(f)", "Error(y is not defined)");
  testEvalToBe("f(x)=x; f(f)", "lambda(x=>internal code)");
  testEvalToBe("f(x)=x(y); f(z)", "Error(y is not defined)");
  testEvalToBe("f(x)=x(3); f(z)", "Error(z is not defined)");
  testEvalToBe("f(x)=x(y); f(2)", "Error(y is not defined)");
  testEvalToBe("f(x)=x(1); f(2)", "Error(2 is not a function)");
});

describe("call and bindings", () => {
  testEvalToBe("f(x)=x+1; f(0)", "1");
  testEvalToBe("f(x)=x+1; f(1)", "2");
  testEvalToBe("f=1;y=2", "()");
  testEvalToBe("f(x)=x+1; y=f(1); y", "2");
  testEvalToBe("f(x)=x+1; y=f(1); f(1)", "2");
  testEvalToBe("f(x)=x+1; y=f(1); z=f(1); z", "2");
  testEvalToBe("f(x)=x+1; g(x)=f(x)+1; g(0)", "2");
  testToExpression("f=99; g(x)=f; g(2)", "f = {99}; g = {|x| {f}}; (g)(2)");
  testEvalToBe("f=99; g(x)=f; g(2)", "99");
  testEvalToBe("f(x)=x; g(x)=f(x); g(2)", "2");
  testEvalToBe("f(x)=x+1; g(x)=f(x)+1; y=g(2); y", "4");
  testEvalToBe("f(x)=x+1; g(x)=f(x)+1; g(2)", "4");
});

describe("function tricks", () => {
  testEvalError("f(x)=f(y)=2; f(2)"); //Error because chain assignment is not allowed
  testEvalToBe("y=2;g(x)=y+1;g(2)", "3");
  testEvalToBe("y=2;g(x)=inspect(y)+1;y", "2");
  MySkip.testEvalToBe("f(x) = x(x); f(f)", "????"); // TODO: Infinite loop. Any solution? Catching proper exception or timeout?
  MySkip.testEvalToBe("f(x, x)=x+x; f(1,2)", "????"); // TODO: Duplicate parameters
  testEvalToBe("myadd(x,y)=x+y; z=myadd; z", "lambda(x,y=>internal code)");
  testEvalToBe("myadd(x,y)=x+y; z=myadd; z(1, 1)", "2");
});

describe("lambda in structures", () => {
  testEvalToBe("myadd(x,y)=x+y; z=[myadd]", "()");
  testEvalToBe("myadd(x,y)=x+y; z=[myadd]; z[0]", "lambda(x,y=>internal code)");
  testEvalToBe("myadd(x,y)=x+y; z=[myadd]; z[0](3,2)", "5");
  testEvalToBe(
    "myaddd(x,y)=x+y; z={x: myaddd}; z",
    "{x: lambda(x,y=>internal code)}"
  );
  testEvalToBe(
    "myaddd(x,y)=x+y; z={x: myaddd}; z.x",
    "lambda(x,y=>internal code)"
  );
  testEvalToBe("myaddd(x,y)=x+y; z={x: myaddd}; z.x(3,2)", "5");
});

describe("ternary and bindings", () => {
  testEvalToBe("f(x)=x ? 1 : 0; f(true)", "1");
  testEvalToBe("f(x)=x>2 ? 1 : 0; f(3)", "1");
});
