open Css;

let widthStyle = (~fullWidth=false, ()) => {
  let formInputInset =
    style([
      border(`px(1), `solid, Settings.border),
      borderRadius(`px(4)),
      padding(`em(0.6)),
      boxShadows([
        Shadow.box(
          ~x=zero,
          ~y=px(1),
          ~blur=px(2),
          ~inset=true,
          rgba(0, 0, 1, 0.08),
        ),
      ]),
      fontSize(`em(1.0)),
    ]);

  let inputFullWidth =
    style([width(`percent(100.)), boxSizing(`borderBox)]);

  let textAreaFullWidth = merge([formInputInset, inputFullWidth]);
  fullWidth ? textAreaFullWidth : formInputInset;
};