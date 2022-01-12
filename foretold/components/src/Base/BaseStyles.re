let floatLeft = Css.float(`left);
let floatRight = Css.float(`right);
let fullWidthFloatLeft =
  Css.[floatLeft, width(`percent(100.0)), boxSizing(`borderBox)];

let borderNone = Css.[borderBottom(`px(0), `solid, hex("fff"))];

let clear = Css.style([Css.clear(`both)]);
