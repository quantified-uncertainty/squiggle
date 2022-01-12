[@bs.module "./ReactKitIcon.js"]
external reactClass: ReasonReact.reactClass = "ReactKitIcon";

[@react.component]
let make = (~icon=?, ~size=?, ~className=?, ~children=ReasonReact.null) =>
  ReasonReact.wrapJsForReason(
    ~reactClass,
    ~props={
      "iconType": icon |> E.O.default(""),
      "size": size |> E.O.default("1em"),
      "className": className,
    },
    children,
  )
  |> ReasonReact.element;