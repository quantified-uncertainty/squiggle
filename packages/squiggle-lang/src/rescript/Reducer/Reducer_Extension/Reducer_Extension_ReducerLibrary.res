module CTV = Reducer_Extension_CodeTreeValue

type codeTreeValue = CTV.codeTreeValue

module Sample = { // In real life real libraries should be somewhere else
  /*
    For an example of mapping polymorphic custom functions. To be deleted after real integration
  */
  let customAdd = (a:float, b:float):float => {a +. b}
}

/*
  Map external calls of Reducer
*/
let dispatch = (call: CTV.functionCall, chain): result<codeTreeValue, 'e> => switch call {

|  ("add", [CtvNumber(a), CtvNumber(b)]) =>  Sample.customAdd(a, b)  -> CtvNumber -> Ok

|  call => chain(call)

/*
If your dispatch is too big you can divide it into smaller dispatches and pass the call so that it gets called finally.

The final chain(call) invokes the builtin default functions of the interpreter.

Via chain(call), all MathJs operators and functions are available for string, number , boolean, array and record
 .e.g + - / * > >= < <= == /= not and or sin cos log ln concat, etc.

// See https://mathjs.org/docs/expressions/syntax.html
// See https://mathjs.org/docs/reference/functions.html

Remember from the users point of view, there are no different modules:
// "doSth( constructorType1 )"
// "doSth( constructorType2 )"
doSth gets dispatched to the correct module because of the type signature. You get function and operator abstraction for free. You don't need to combine different implementations into one type. That would be duplicating the repsonsibility of the dispatcher.
*/
}
