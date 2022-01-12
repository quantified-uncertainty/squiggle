/* For the icons, font-awesome (or similar?) is a possibility */

module Styles = {
  open Css;
  let alertBox =
    style([
      borderRadius(Settings.BorderRadius.tight),
      padding2(~v=`em(0.5), ~h=`em(0.8)),
      marginBottom(`em(0.75)),
    ]);

  // Colors from https://getbootstrap.com/docs/4.0/components/alerts/
  // They may look better on white background than grey/smokeWhite
  let colors = (t: Settings.Alert.t) =>
    style([
      color(Settings.Alert.color(t)),
      backgroundColor(Settings.Alert.background(t)),
    ]);
};

/**
 * Primary - Communicate information like "Welcome, now you can do..."
 * Info - Less significant information
 * Success
 * Warning
 * Error
 */

type type_ = [ | `primary | `info | `success | `warning | `error];

[@react.component]
let make = (~type_: type_=`info, ~children) => {
  let classes = Styles.alertBox ++ " " ++ Styles.colors(type_);
  <div className=classes> children </div>;
};