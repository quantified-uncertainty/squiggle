let percentageSign = Css.(style([opacity(0.5), marginLeft(`em(0.1))]));

[@react.component]
let make = (~percentage, ~precision) => {
  let numberWithPresentation =
    NumberShower.JS.numberShow(percentage, precision);
  <span>
    {NumberShower.JS.valueGet(numberWithPresentation)
     |> ReasonReact.string}
    <span className=percentageSign> {"%" |> ReasonReact.string} </span>
  </span>;
};
