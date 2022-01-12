module JS = {
  [@bs.deriving abstract]
  type numberPresentation = {
    value: string,
    power: option(float),
    symbol: option(string),
  };

  [@bs.module "./numberShower.js"]
  external numberShow: (float, int) => numberPresentation = "numberShow";
};

let sup = Css.(style([fontSize(`em(0.6)), verticalAlign(`super)]));

[@react.component]
let make = (~number, ~precision) => {
  let numberWithPresentation = JS.numberShow(number, precision);
  <span>
    {JS.valueGet(numberWithPresentation) |> ReasonReact.string}
    {JS.symbolGet(numberWithPresentation)
     |> E.O.React.fmapOrNull(ReasonReact.string)}
    {JS.powerGet(numberWithPresentation)
     |> E.O.React.fmapOrNull(e =>
          <span>
            {{j|\u00b710|j} |> ReasonReact.string}
            <span className=sup>
              {e |> E.Float.toString |> ReasonReact.string}
            </span>
          </span>
        )}
  </span>;
};
