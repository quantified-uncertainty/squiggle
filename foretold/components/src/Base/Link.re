let headerLink = (~className, ~isDisabled=false, ()) => {
  let primaryStyles =
    Css.(
      style([
        textDecoration(`none),
        userSelect(`none),
        color(Settings.Text.LightBackground.main),
        hover([color(Settings.Text.LightBackground.light)]),
        focus([textDecoration(`none)]),
      ])
    );

  let disabledStyles =
    isDisabled ? Css.(style([pointerEvents(`none), cursor(`default)])) : "";

  Css.(merge([primaryStyles, className, disabledStyles]));
};

[@react.component]
let make =
    (~href="#", ~onClick=?, ~isDisabled=false, ~className="", ~children) => {
  <a
    disabled=isDisabled
    href
    className={headerLink(~className, ~isDisabled, ())}
    ?onClick>
    children
  </a>;
};
