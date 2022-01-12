let fn = (a: (array(float), array(float), bool)) => ();
let fn2 = (a: string) => ();

[@bs.module "./GuesstimateInput.js"]
external guesstimateInput: ReasonReact.reactClass = "GuesstimateInput";

[@react.component]
let make =
    (
      ~sampleCount=10000,
      ~min=None,
      ~max=None,
      ~initialValue=None,
      ~onUpdate=fn,
      ~onChange=fn2,
      ~focusOnRender=true,
      ~children=ReasonReact.null,
    ) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=guesstimateInput,
    ~props={
      "sampleCount": sampleCount,
      "onUpdate": onUpdate,
      "initialValue": initialValue,
      "onChange": onChange,
      "min": min,
      "max": max,
      "focusOnRender": focusOnRender,
    },
    children,
  )
  |> ReasonReact.element;