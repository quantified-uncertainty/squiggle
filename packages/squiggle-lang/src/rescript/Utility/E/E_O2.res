module O = E_O
let default = (a, b) => O.default(b, a)
let defaultFn = (a, b) => O.defaultFn(b, a)
let toExn = (a, b) => O.toExn(b, a)
let fmap = (a, b) => O.fmap(b, a)
let toResult = (a, b) => O.toResult(b, a)
let bind = (a, b) => O.bind(b, a)
