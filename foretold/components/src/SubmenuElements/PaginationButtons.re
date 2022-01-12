open Base;

type directionButton = {
  isDisabled: bool,
  onClick: ReactEvent.Mouse.t => unit,
};

type currentValue =
  | Item(int)
  | Range(int, int);

type t = {
  currentValue,
  max: int,
  pageLeft: directionButton,
  pageRight: directionButton,
};

let _text = (t: t) => {
  let currentValue =
    switch (t.currentValue) {
    | Item(i) => i |> string_of_int
    | Range(a, b) => (a |> string_of_int) ++ " - " ++ (b |> string_of_int)
    };
  currentValue ++ " of " ++ (t.max |> string_of_int);
};

module Styles = {
  let buttonLabel =
    Css.(
      style([
        BaseStyles.floatLeft,
        marginRight(`em(0.5)),
        marginTop(`em(0.12)),
        color(Colors.accentBlue),
      ])
    );

  let rightButton = Css.(style([marginLeft(`em(0.3))]));
  let leftButton = Css.(style([marginLeft(`em(0.3))]));
};

let _directionLink = (t: directionButton, icon: string, positionStyles) =>
  <Button
    isDisabled={t.isDisabled}
    onClick={t.onClick}
    className=positionStyles
    size=Button.(Small)>
    <ReactKitIcon icon />
  </Button>;

let make = (t: t) =>
  <>
    <span className=Styles.buttonLabel>
      {_text(t) |> ReasonReact.string}
    </span>
    {_directionLink(t.pageLeft, "CHEVRON_LEFT", "")}
    {_directionLink(t.pageRight, "CHEVRON_RIGHT", Styles.rightButton)}
  </>;