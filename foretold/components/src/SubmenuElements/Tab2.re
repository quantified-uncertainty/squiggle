open Base;

let styles = (~isDisabled=false, ~heightPadding=0, ()) => {
  let main =
    Css.(
      style([
        padding2(~v=`px(heightPadding), ~h=`px(6)),
        BaseStyles.floatLeft,
        borderRadius(Colors.BorderRadius.medium),
        border(`px(1), `solid, Colors.accentBlueO8),
        marginTop(`em(0.05)),
        lineHeight(`em(1.35)),
      ])
    );
  let disabledStyles = Css.(style([background(Colors.greydisabled)]));
  isDisabled ? Css.merge([disabledStyles, main]) : main;
};

[@react.component]
let make = (~isActive, ~onClick=?, ~number: option(int)=?, ~children) => {
  let textStyle =
    Css.(style([BaseStyles.floatLeft, marginRight(`em(0.4))]));

  let colors =
    Colors.Text.(
      isActive
        ? Css.[
            color(LightBackground.active),
            hover([color(LightBackground.active)]),
          ]
        : Css.[
            color(LightBackground.main),
            hover([color(LightBackground.active)]),
          ]
    );

  <Link
    ?onClick
    className=Css.(
      style([BaseStyles.floatLeft, marginRight(`em(1.8))] @ colors)
    )
    isDisabled=false>
    <span className=textStyle> children </span>
    {number
     |> E.O.React.fmapOrNull(number =>
          <span className={styles()}>
            {number |> string_of_int |> ReasonReact.string}
          </span>
        )}
  </Link>;
};
