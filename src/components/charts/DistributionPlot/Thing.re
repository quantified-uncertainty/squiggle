
  [@bs.module "./thingy.js"]
  external reactClass : ReasonReact.reactClass = "Input";

  [@react.component]
  let make = (~data=?, ~children=ReasonReact.null) =>
    ReasonReact.wrapJsForReason(
      ~reactClass,
      ~props={"data": Js.Undefined.fromOption(data)},
      children,
    )|> ReasonReact.element;