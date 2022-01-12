open Base;

module Styles = {
  open Css;
  let outer =
    style(
      [
        padding2(~v=`em(1.0), ~h=`em(2.)),
        backgroundColor(`rgb((255, 255, 255))),
        position(`relative),
        boxShadows([
          Shadow.box(
            ~x=px(1),
            ~y=px(1),
            ~blur=px(2),
            ~spread=px(1),
            ~inset=false,
            `hex("dee5e9"),
          ),
        ]),
      ]
      @ BaseStyles.fullWidthFloatLeft,
    );
};

[@react.component]
let make = (~links: ReasonReact.reactElement) =>
  <Div styles=[Styles.outer]> <Div float=`left> links </Div> </Div>;
