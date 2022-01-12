open Base;

let defaultRowHorizontalPadding = `em(1.5);

module Styles = {
  let row =
    Css.(
      style(
        [
          padding2(~v=`zero, ~h=defaultRowHorizontalPadding),
          borderBottom(`px(1), `solid, Colors.accentBlue1a),
          display(`flex),
          flexDirection(`row),
          selector(":last-child", BaseStyles.borderNone),
        ]
        @ BaseStyles.fullWidthFloatLeft,
      )
    );

  let textArea =
    Css.(
      style(
        [
          padding2(~v=`em(0.8), ~h=`em(1.0)),
          borderRadius(Colors.BorderRadius.tight),
          color(Colors.Text.LightBackground.p),
        ]
        @ BaseStyles.fullWidthFloatLeft,
      )
    );

  let topRow =
    Css.(
      style(
        [
          padding2(~v=`zero, ~h=defaultRowHorizontalPadding),
          paddingTop(`em(0.4)),
          display(`flex),
          flexDirection(`row),
        ]
        @ BaseStyles.fullWidthFloatLeft,
      )
    );

  let bottomRow =
    Css.(
      style(
        [
          padding2(~v=`zero, ~h=`em(0.4)),
          paddingBottom(`em(0.4)),
          display(`flex),
          flexDirection(`row),
          borderBottom(`px(1), `solid, Colors.accentBlue1a),
        ]
        @ BaseStyles.fullWidthFloatLeft,
      )
    );

  let clickableRow =
    Css.(
      style([
        hover([background(Colors.lightGrayBackground)]),
        cursor(`pointer),
      ])
    );

  module Elements = {
    let primaryText =
      Css.style([
        Css.fontSize(`em(1.05)),
        Css.lineHeight(`em(1.5)),
        Css.fontWeight(`num(600)),
        Css.color(`hex("384e67")),
      ]);

    let link' =
      Css.[
        marginRight(`em(1.0)),
        color(Colors.textMedium),
        hover([color(Colors.textDark)]),
      ];

    let link = (~isUnderlined=false, ()) =>
      Css.(
        style(isUnderlined ? link' @ [textDecoration(`underline)] : link')
      );
  };
};

module Cell = {
  let standardCellPadding =
    Css.(style([paddingTop(`em(0.7)), paddingBottom(`em(0.5))]));

  let style = flexAmount => Css.(style([flex(flexAmount)]));

  [@react.component]
  let make = (~flex, ~className="", ~properties=[], ~children) =>
    <Div
      className={Css.merge([
        style(flex),
        standardCellPadding,
        className,
        Css.style(properties),
      ])}>
      children
    </Div>;
};

module HeaderRow = {
  module Styles = {
    let headerRow =
      Css.(
        style(
          [
            background(Colors.lightGrayBackground),
            color(Colors.Text.LightBackground.main),
            borderBottom(`px(1), `solid, Colors.accentBlueO8),
            display(`flex),
            flexDirection(`row),
            padding2(~v=`em(0.1), ~h=defaultRowHorizontalPadding),
          ]
          @ BaseStyles.fullWidthFloatLeft,
        )
      );
  };

  [@react.component]
  let make = (~children) => <Div styles=[Styles.headerRow]> children </Div>;
};

module Row = {
  let textSection = text => <Div styles=[Styles.textArea]> text </Div>;

  [@react.component]
  let make = (~className="", ~bottomSubRow=?, ~onClick=?, ~children) => {
    switch (bottomSubRow) {
    | Some(bottomSubRow) =>
      let commonClasses =
        onClick |> E.O.isSome
          ? [Styles.clickableRow, className] : [className];
      <Div styles=commonClasses ?onClick>
        <Div styles=[Styles.topRow]> children </Div>
        <Div styles=[Styles.bottomRow]> bottomSubRow </Div>
      </Div>;
    | None =>
      let commonClasses =
        onClick |> E.O.isSome
          ? [Styles.row, Styles.clickableRow, className]
          : [Styles.row, className];
      <Div styles=commonClasses ?onClick> children </Div>;
    };
  };
};

[@react.component]
let make = (~children) => <div> children </div>;
