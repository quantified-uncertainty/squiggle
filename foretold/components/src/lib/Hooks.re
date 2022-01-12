type size = {
  .
  "width": int,
  "height": int,
};

[@bs.module "react-use"]
external useSize:
  (size => ReasonReact.reactElement, size) => (React.element, size) =
  "useSize";

type useTitleOptions = {. "restoreOnUnmount": bool};

[@bs.module "react-use"]
external useTitle: (string, useTitleOptions) => unit = "useTitle";