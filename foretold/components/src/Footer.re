open Base;

let str = ReasonReact.string;

module Styles = {
  open Css;
  /* PaddingTop is applied to copyright and link items to get
     space between lines when wrapped.
     Both also have horizontal margin to ensure minimum space between items,
     this is then subtracted from at the edges of the "sections"-class. */
  let itemsPaddingTop = `em(1.2);
  let betweenItemsMargin = 0.8;

  /* Layout box for spacing in the page */
  let layoutBox =
    style(
      [margin2(~v=`em(2.), ~h=`zero), padding2(~v=`zero, ~h=`em(2.))]
      @ BaseStyles.fullWidthFloatLeft,
    );

  /* footerBox inside layoutBox, here the horizontal border is in line with the text.
     PaddingTop is added here instead of "itemsPaddingTop" to decrease line distance
     when wrap and make items appear more as a group */
  let footerBox =
    style([
      borderTop(`px(1), `solid, Colors.border),
      paddingTop(`em(0.3)),
      fontSize(`em(0.9)),
      fontWeight(`bold),
      color(Colors.textMedium),
    ]);

  /* Sections enables wrapping of left and right section */
  let sections =
    style([
      display(`flex),
      flexWrap(`wrapReverse),
      justifyContent(`spaceBetween),
      margin2(~v=`zero, ~h=`em(-. betweenItemsMargin)),
    ]);

  let element =
    style([
      flexGrow(10.),
      paddingTop(itemsPaddingTop),
      paddingRight(`em(0.2)),
      margin2(~v=`zero, ~h=`em(betweenItemsMargin)),
    ]);

  /* Some extra marginBottom is added to reinforce the links as
     a group vs copyright.
     The element grows a little bit to add some spacing for larger screens */
  let items =
    style([
      display(`flex),
      flexWrap(`wrap),
      flexGrow(1.),
      media("(min-width: 720px)", [justifyContent(`spaceBetween)]),
      listStyleType(`none),
      padding(`zero),
      margin(`zero),
      marginBottom(`em(1.2)),
      selector(
        "li",
        [
          paddingTop(itemsPaddingTop),
          margin2(~v=`zero, ~h=`em(betweenItemsMargin)),
          selector(
            "a",
            [
              textDecoration(`none),
              color(Colors.textMedium),
              paddingBottom(`px(1)),
              selector(
                ":hover",
                [
                  color(Colors.linkAccent),
                  borderBottom(`px(1), `solid, Colors.linkAccent),
                ],
              ),
            ],
          ),
        ],
      ),
    ]);
};

/**
 * Shows a footer with an element (ie. name and copyright), and a list of items
 */
[@react.component]
let make =
    (
      ~logo: ReasonReact.reactElement,
      ~links: array(ReasonReact.reactElement),
    ) =>
  <div className=Styles.layoutBox>
    <div className=Styles.footerBox>
      <div className=Styles.sections>
        <div className=Styles.element> logo </div>
        <ul className=Styles.items>
          {links->Belt.Array.mapWithIndex((index, item) =>
             <li key={"footer-li-" ++ string_of_int(index)}> item </li>
           )
           |> ReasonReact.array}
        </ul>
      </div>
    </div>
  </div>;
