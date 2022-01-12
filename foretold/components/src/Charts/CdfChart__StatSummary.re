module Styles = {
  open Css;
  let textOverlay = style([position(`absolute)]);
  let mainText = style([fontSize(`em(1.1)), color(Settings.darkLink)]);
  let secondaryText =
    style([fontSize(`em(0.9)), color(Settings.accentBlue)]);
};

[@react.component]
let make = (~cdf: Types.Dist.t, ~showMean=true) =>
  <>
    {showMean
       ? <div className=Styles.mainText>
           <NumberShower
             precision=2
             number={cdf |> Types.Dist.findX(0.5)}
           />
         </div>
       : ReasonReact.null}
    <div className=Styles.secondaryText>
      <NumberShower
        precision=2
        number={cdf |> Types.Dist.findX(0.05)}
      />
      {" to " |> ReasonReact.string}
      <NumberShower
        precision=2
        number={cdf |> Types.Dist.findX(0.95)}
      />
    </div>
  </>;
