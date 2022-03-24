module BuiltIn = Reducer_Dispatch_BuiltIn
module T = Reducer_CodeTree_T
module CTV = Reducer_Extension.CodeTreeValue
module MJ = Reducer_MathJs_Parse
module MJT = Reducer_MathJs_ToCodeTree
module RLE = Reducer_Extra_List
module Rerr = Reducer_Error
module Result = Belt.Result

type codeTree = T.codeTree
type codeTreeValue = CTV.codeTreeValue
type reducerError = Rerr.reducerError

/*
  Shows the Lisp Code as text lisp code
*/
let rec show = codeTree => switch codeTree {
| T.CtList(aList) => `(${(Belt.List.map(aList, aValue => show(aValue))
    -> RLE.interperse(" ")
    -> Belt.List.toArray -> Js.String.concatMany(""))})`
| CtValue(aValue) => CTV.show(aValue)
}

let showResult = (codeResult) => switch codeResult {
| Ok(a) => `Ok(${show(a)})`
| Error(m) => `Error(${Js.String.make(m)})`
}

/*
  Converts a MathJs code to Lisp Code
*/
let parse_ = (expr: string, parser, converter): result<codeTree, reducerError> =>
  expr -> parser -> Result.flatMap(node => converter(node))

let parse = (mathJsCode: string): result<codeTree, reducerError> =>
  mathJsCode -> parse_( MJ.parse, MJT.fromNode )

module MapString = Belt.Map.String
type bindings = MapString.t<unit>
let defaultBindings: bindings = MapString.fromArray([])
// TODO Define bindings for function execution context

/*
  After reducing each level of code tree, we have a value list to evaluate
*/
let reduceValueList = (valueList: list<codeTreeValue>): result<codeTreeValue, 'e> =>
      switch valueList {
        | list{CtvSymbol(fName), ...args} =>
            (fName, args->Belt.List.toArray) -> BuiltIn.dispatch
        | _ =>
            valueList -> Belt.List.toArray -> CTV.CtvArray -> Ok
      }

/*
  Recursively evaluate/reduce the code tree
*/
let rec reduceCodeTree = (codeTree: codeTree, bindings): result<codeTreeValue, 'e> =>
  switch codeTree {
  | T.CtValue( value ) => value -> Ok
  | T.CtList( list ) => {
    let racc: result<list<codeTreeValue>, 'e> = list -> Belt.List.reduceReverse(

      Ok(list{}),
      (racc, each: codeTree) => racc->Result.flatMap( acc => {

                  each
                  ->  reduceCodeTree(bindings)
                  ->  Result.flatMap( newNode => {
                          acc->Belt.List.add(newNode)->Ok
                      })

      })

    )
    racc -> Result.flatMap( acc => acc->reduceValueList )}
  }

let evalWBindingsCodeTree = (aCodeTree, bindings): result<codeTreeValue, 'e> =>
  reduceCodeTree(aCodeTree, bindings)

/*
  Evaluates MathJs code via Lisp using bindings and answers the result
*/
let evalWBindings = (codeText:string, bindings: bindings) => {
  parse(codeText) -> Result.flatMap(code => code -> evalWBindingsCodeTree(bindings))
}

/*
  Evaluates MathJs code via Lisp and answers the result
*/
let eval = (code: string) => evalWBindings(code, defaultBindings)
