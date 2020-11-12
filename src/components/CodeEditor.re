[@bs.module "./CodeEditor.js"]
external codeEditor: ReasonReact.reactClass = "CodeEditor";

[@react.component]
let make = (~value="", ~onChange=(_:string) => (), ~children=ReasonReact.null) =>
  ReasonReact.wrapJsForReason(~reactClass=codeEditor, ~props={
      "value": value,
      "onChange": onChange
  }, children)
  |> ReasonReact.element;
