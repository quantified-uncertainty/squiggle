open Base;

[@react.component]
let make = (~children) =>
  <Div
    styles=[
      Css.(
        style(
          [
            background(Colors.white),
            border(`px(1), `solid, Colors.border),
            borderRadius(`px(5)),
          ]
          @ BaseStyles.fullWidthFloatLeft,
        )
      ),
    ]>
    children
  </Div>;

let defaultPadding = Css.padding2(~v=`em(0.0), ~h=`em(1.5));

module HeaderRow = {
  module Styles = {
    let itemTopPadding = Css.paddingTop(`em(0.5));
    let itemBottomPadding = Css.paddingBottom(`em(0.35));
    let itemRightPadding = Css.paddingRight(`em(0.9));
  };

  module Title = {
    [@react.component]
    let make = (~children) =>
      <Div
        styles=[
          Css.(
            style([
              color(Colors.textDark),
              paddingTop(`em(0.6)),
              paddingBottom(`em(0.6)),
              Settings.FontWeights.heavy,
            ])
          ),
        ]>
        children
      </Div>;
  };

  [@react.component]
  let make = (~children) =>
    <Div
      styles=[
        Css.(
          style(
            [
              borderBottom(`px(1), `solid, Colors.accentBlueO8),
              defaultPadding,
            ]
            @ BaseStyles.fullWidthFloatLeft,
          )
        ),
      ]>
      children
    </Div>;
};

module Body = {
  [@react.component]
  let make = (~children) =>
    <Div styles=[Css.style(BaseStyles.fullWidthFloatLeft)]> children </Div>;
};

module BodyPadding = {
  [@react.component]
  let make = (~v=`em(1.5), ~children) =>
    <Div
      styles=[
        Css.style(
          [Css.padding2(~v, ~h=`em(1.5))] @ BaseStyles.fullWidthFloatLeft,
        ),
      ]>
      children
    </Div>;
};

module Section = {
  module StyleProps = {
    open Css;
    type background = [ | `white | `grey];
    type padding = [ | `all | `none | `top | `bottom];
    type border = [ | `none | `top | `bottom | `topBottom];

    let baseClass = style([clear(`both)]);
    let bgGrey = style([backgroundColor(Settings.smokeWhite)]);
    let paddingAll = style([padding(`em(1.5))]);
    let paddingTop =
      style([
        padding4(~top=`em(1.5), ~right=`zero, ~bottom=`zero, ~left=`zero),
      ]);
    let paddingBottom =
      style([
        padding4(~top=`zero, ~right=`zero, ~bottom=`em(1.5), ~left=`zero),
      ]);
    let borderTop =
      style([borderTop(`px(1), `solid, Settings.accentBlue1a)]);
    let borderBottom =
      style([borderBottom(`px(1), `solid, Settings.accentBlue1a)]);
    let flexCls = style([display(`flex)]);

    [@bs.send] external push: (Js.Array.t('a), 'a) => unit = "";
    let toClasses =
        (background: background, border: border, padding: padding, flex: bool) => {
      // Array for more speed and some imperative ease
      let cls = [|baseClass|];
      // Background
      switch (background) {
      | `grey => push(cls, bgGrey)
      | _ => ()
      };
      // Padding
      switch (padding) {
      | `all => push(cls, paddingAll)
      | `none => ()
      | `top => push(cls, paddingTop)
      | `bottom => push(cls, paddingBottom)
      };
      // Border
      switch (border) {
      | `none => ()
      | `top => push(cls, borderTop)
      | `bottom => push(cls, borderBottom)
      | `topBottom =>
        push(cls, borderTop);
        push(cls, borderBottom);
      };
      // Flex
      if (flex) {
        push(cls, flexCls);
      };
      Js.Array.joinWith(" ", cls);
    };
  };

  /**
   * Section of a PageCard
   * background: `white (default) | `grey
   * border: `top | `bottom | `none (default)
   * padding: `none | `top | `bottom | `all (default)
   * flex: true | false
   */
  [@react.component]
  let make =
      (
        ~background: StyleProps.background=`white,
        ~border: StyleProps.border=`none,
        ~padding: StyleProps.padding=`all,
        ~flex=false,
        ~children,
      ) =>
    <div className={StyleProps.toClasses(background, border, padding, flex)}>
      children
    </div>;
};

module VerticalSpace = {
  let spaceStyle = Css.(style([marginTop(`em(1.5))]));

  [@react.component]
  let make = _ => <div className=spaceStyle />;
};

module H1 = {
  [@react.component]
  let make = (~children) =>
    <h1
      className=Css.(
        style(
          [
            fontSize(`em(1.15)),
            color(`hex("192D44")),
            Settings.FontWeights.heavy,
            marginTop(`em(0.0)),
            marginBottom(`em(0.4)),
          ]
          @ BaseStyles.fullWidthFloatLeft,
        )
      )>
      children
    </h1>;
};

module P = {
  [@react.component]
  let make = (~children) =>
    <p
      className=Css.(
        style([color(Colors.Text.LightBackground.p), lineHeight(`em(1.5))])
      )>
      children
    </p>;
};
