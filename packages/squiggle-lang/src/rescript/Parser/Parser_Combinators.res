module ParserBase = {
  type t<'a> = string => list<('a, string)>
  let returnP: 'a => t<'a> = (v, inp) => list{(v, inp)}
  let failure: t<'a> = _ => list{}
  exception Wrongo(string)
  let wrongoMessage = "The semantics, by convention, are that singleton list indicates success and empty list indicates failure. This will be refactored into option later."
  let item: t<char> = inp => {
    if String.length(inp) == 0 {
      list{}
    } else {
      let x = Js.String2.charAt(inp, 0)
      let xs = Js.String2.sliceToEnd(inp, ~from=1)
      list{(String.get(x, 0), xs)}
    }
  }
  let parse: (t<'a>, string) => list<('a, string)> = (p, inp) => p(inp)
  let choice: (t<'a>, t<'a>) => t<'a> = (p, q) => {
    inp => {
      switch parse(p, inp) {
      | list{} => parse(q, inp)
      | list{(v, out)} => list{(v, out)}
      | _ => raise(Wrongo(wrongoMessage))
      }
    }
  }
}

include ParserBase
module ParserMonad = Rationale.Monad.MakeBasic({
  type t<'a> = ParserBase.t<'a>
  let {parse, returnP} = module(ParserBase)
  let bind = (x: t<'a>, f: 'a => t<'b>): t<'b> => {
    inp => {
      switch parse(x, inp) {
      | list{} => list{}
      | list{(v, out)} => parse(f(v), out)
      | _ => raise(Wrongo(wrongoMessage))
      }
    }
  }
  let return = returnP
  let fmap = #DefineWithBind
})
let {bind, fmap} = module(ParserMonad)
let satisf: (char => bool) => t<char> = p => {
  bind(item, x =>
    if p(x) {
      returnP(x)
    } else {
      failure
    }
  )
}

let parserCharToParserString: t<char> => t<string> = fmap(x => String.make(1, x))

// module LazyP = {
//   let parseL: lazy_t<t<'a>> =
// }

module Primitive = {
  open Parser_Utility.CharPredicates
  let digit: t<char> = satisf(isDigit)
  let lower: t<char> = satisf(isLower)
  let upper: t<char> = satisf(isUpper)
  let letter: t<char> = satisf(isAlpha)
  let alphanum: t<char> = satisf(isAlphaNum)
  let checkchar: char => t<char> = x => satisf(c => c == x)
  let space: t<char> = satisf(isSpace)
  let digitString: t<string> = parserCharToParserString(digit)
  let spaceString: t<string> = parserCharToParserString(space)
  let alphanumString: t<string> = parserCharToParserString(alphanum)
  let lowerString: t<string> = parserCharToParserString(lower)

  let rec checkstring: string => t<string> = inp => {
    if String.length(inp) == 0 {
      returnP(inp)
    } else {
      let x = Js.String2.charAt(inp, 0)
      let xs = Js.String2.sliceToEnd(inp, ~from=1)
      bind(bind(checkchar(String.get(x, 0)), _ => checkstring(xs)), _ =>
        returnP(Js.String2.concat(x, xs))
      )
    }
  }

  let rec many_: t<'a> => t<list<'a>> = p => choice(many1_(p), returnP(list{}))
  and many1_: t<'a> => t<list<'a>> = p =>
    bind(p, v =>
      bind(many_(p), vs =>
        returnP(list{
          Js.String2.concat(v, Js.List.foldLeft((. a, b) => Js.String2.concat(a, b), "", vs)),
        })
      )
    )
  let many: t<'a> => t<'a> = p => fmap(Parser_Utility.listStringFlatten, many_(p))
  let many1: t<'a> => t<'a> = p => fmap(Parser_Utility.listStringFlatten, many1_(p))

  let nat: t<int> = bind(many1(digitString), xs =>
    returnP(Belt.Float.toInt(Js.Float.fromString(xs)))
  )
  let whitespace: t<unit> = bind(many(spaceString), _ => returnP())

  let token: t<'a> => t<'a> = p =>
    bind(whitespace, _ => bind(p, v => bind(whitespace, _ => returnP(v))))

  let natural: t<int> = token(nat)
  let symbol: string => t<string> = xs => xs->checkstring->token
}

module Symbols = {
  let normalNode: t<string> = Primitive.symbol("normal")
  let openParen: t<string> = Primitive.symbol("(")
  let closeParen: t<string> = Primitive.symbol(")")
  let comma: t<string> = Primitive.symbol(",")
}
