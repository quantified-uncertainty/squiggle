module CharPredicates = {
  let isDigit: char => bool = x => {
    let xString = String.make(1, x)
    Js.String2.includes("0123456789", xString)
  }
  let isLower: char => bool = x => {
    let xString = String.make(1, x)
    Js.String2.includes("abcdefghijklmnopqrstuvwxyz", xString)
  }
  let isUpper: char => bool = x => {
    let xString = String.make(1, x)
    Js.String2.includes("ABCDEFGHIJKLMNOPQRSTUVWXYZ", xString)
  }
  let isAlpha: char => bool = x => {
    isUpper(x) || isLower(x)
  }
  let isAlphaNum: char => bool = x => {
    isAlpha(x) || isDigit(x)
  }
  let isSpace: char => bool = x => {
    let xString = String.make(1, x)
    Js.String2.includes(" \t\n", xString)
  }
}

let listStringFlatten: list<string> => string = xs => {
  Js.String2.concatMany("", Belt.List.toArray(xs))
}
let listStringFlattenTuple1: ((list<string>, 'a)) => (string, 'a) = tup => {
  let (xs, y) = tup
  let xs' = Belt.List.toArray(xs)
  (Js.String2.concatMany("", xs'), y)
}
