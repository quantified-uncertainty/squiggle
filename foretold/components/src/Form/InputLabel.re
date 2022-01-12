let inputHeader =
  Css.(style([paddingLeft(`em(0.4)), paddingBottom(`em(0.6))]));

[@react.component]
let make = (~children) => <div className=inputHeader> children </div>;
