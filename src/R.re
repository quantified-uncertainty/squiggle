
let ste = React.string;
let showIf = (cond, comp) => cond ? comp : ReasonReact.null;

module O = {
    let defaultNull = E.O.default(ReasonReact.null);
    let fmapOrNull = (fn, el) => el |> E.O.fmap(fn) |> E.O.default(ReasonReact.null);
    let flatten = E.O.default(ReasonReact.null);
};