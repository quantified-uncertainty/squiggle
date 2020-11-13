module Styles = {
  open Css;
  let h3 = style([fontSize(`em(1.5)), marginBottom(`em(1.5))]);
  let card = style([marginTop(`em(2.)), marginBottom(`em(2.))]);
};

module Table = {
  module TableStyles = {
    open Css;
    let row = style([display(`flex), height(`em(4.))]);
    let col = (~f=1.0, ()) => {
      style([flex(`num(f))]);
    };
  };

  [@react.component]
  let make = () => {
    <>
    </>;
  };
};

[@react.component]
let make = () => {
  <div> <div className=Styles.card> <Table /> </div> </div>;
};