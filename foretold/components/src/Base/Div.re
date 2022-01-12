open Css;

let fnWithDefault = (fn, r) =>
  r |> E.O.fmap(e => Css.style(fn(e))) |> E.O.default("");

/* TODO: Instead of accepting styles, this should accept "classNames" and use Css.merge */

[@react.component]
let make =
    (
      ~styles=[],
      ~className="",
      ~flex=?,
      ~flexDirection=?,
      ~float=?,
      ~alignItems=?,
      ~justifyContent=?,
      ~alignContent=?,
      ~onClick=_ => (),
      ~children=ReasonReact.null,
    ) => {
  let flexStyle = flex |> fnWithDefault(e => [Css.flex(e)]);
  let floatStyle = float |> fnWithDefault(e => [Css.float(e)]);
  let alignItemsStyle =
    alignItems |> fnWithDefault(e => [Css.alignItems(e)]);
  let justifyContentStyle =
    justifyContent |> fnWithDefault(e => [Css.justifyContent(e)]);
  let alignContentStyle =
    alignContent |> fnWithDefault(e => [Css.alignContent(e)]);

  let directionStyle =
    flexDirection
    |> fnWithDefault(e => [display(`flex), Css.flexDirection(e)]);

  let allStyles =
    Css.merge([
      flexStyle,
      directionStyle,
      floatStyle,
      alignItemsStyle,
      justifyContentStyle,
      alignContentStyle,
      className,
      ...styles,
    ]);

  <div className=allStyles onClick> children </div>;
};