let ste = React.string
let showIf = (cond, comp) => cond ? comp : React.null

module O = {
  let defaultNull = E.O.default(React.null)
  let fmapOrNull = (fn, el) => el |> E.O.fmap(fn) |> E.O.default(React.null)
  let flatten = E.O.default(React.null)
}
