let fn = (a: string) => ();
let fn2 = () => ();

[@bs.module "./AutosizeTextareaInput.js"]
external guesstimateInput: ReasonReact.reactClass = "AutosizeTextareaInput";

[@react.component]
let make =
    (
      ~rows: option(int)=?,
      ~maxRows: option(int)=?,
      ~minRows: option(int)=?,
      ~useCacheForDOMMeasurements: option(bool)=?,
      ~value="",
      ~onChange=fn,
      ~onHeightChange=fn2,
      ~className: option(string)=?,
      ~style: option(ReactDOMRe.Style.t)=?,
      ~children=ReasonReact.null,
    ) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=guesstimateInput,
    ~props={
      "rows": rows,
      "maxRows": maxRows,
      "minRows": minRows,
      "useCacheForDOMMeasurements": useCacheForDOMMeasurements,
      "value": value,
      "onChange": onChange,
      "onHeightChange": onHeightChange,
      "className": className,
      "style": style,
    },
    children,
  )
  |> ReasonReact.element;