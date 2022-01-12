module Styles = {
  open Css;
  let imageCropper = width =>
    style([
      Css.width(`em(width)),
      height(`em(width)),
      overflow(`hidden),
      float(`left),
      position(`relative),
      borderRadius(`percent(20.)),
    ]);
  let image =
    style([
      float(`left),
      margin2(~v=`zero, ~h=`auto),
      height(`auto),
      width(`percent(100.)),
    ]);
};

[@react.component]
let make = (~src: string, ~width=1., ()) =>
  <span className={Styles.imageCropper(width)}>
    <img src className=Styles.image />
  </span>;
