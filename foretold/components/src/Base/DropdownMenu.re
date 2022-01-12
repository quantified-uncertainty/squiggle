module Styles = {
  open Css;
  module Colors = Settings;

  // Reverting to "rc-dropdown" brings back some styles from the original css file
  let prefixCls = "ft-dropdown";
  let itemVerticalPadding = 5;
  let itemHorizontalPadding = 12;
  let bgColor = Colors.white;
  let textColor = Colors.textDarker;
  let hoverColor = `hex("ebfaff");
  let textSize = `rem(0.8);
  let textLineHeight = `em(1.3);

  Menu.Styles.createStyle(
    ~prefixCls,
    ~itemVerticalPadding,
    ~itemHorizontalPadding,
    ~textColor,
    ~bgColor,
    ~hoverColor,
    ~textSize,
    ~textLineHeight,
    (),
  );

  let dropdownTrigger =
    style([
      border(`px(1), `solid, Settings.border),
      borderRadius(`px(3)),
      // Subtracting 2 from horizontal padding to account for border
      padding2(
        ~v=`px(itemVerticalPadding),
        ~h=`px(itemHorizontalPadding - 2),
      ),
      backgroundColor(bgColor),
      fontSize(textSize),
      lineHeight(textLineHeight),
      fontFamily(Settings.Text.standardFont),
      color(textColor),
      // Selector for trigger element with overlay open
      selector(
        "&." ++ prefixCls ++ "-open",
        [borderColor(`hex("40a9ff")), color(`hex("40a9ff"))],
      ),
    ]);
};

[@react.component]
let make = (~title, ~trigger=Dropdown.Hover, ~children) => {
  let overlay = <div> children </div>;
  <Dropdown trigger overlay prefixCls=Styles.prefixCls>
    <button className=Styles.dropdownTrigger>
      <span> {title |> React.string} </span>
      <Icon.DownArrow />
    </button>
  </Dropdown>;
};
