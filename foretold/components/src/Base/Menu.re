/**
 * Menu component and sibling components provides define menu items,
 * submenues and dividers. See make for usage.
 *
 * It is binding to https://github.com/react-component/menu
 */
[@bs.module "rc-menu"]
external rcMenuClass: ReasonReact.reactClass = "default";

[@bs.module "rc-menu"]
external rcSubMenuClass: ReasonReact.reactClass = "SubMenu";

[@bs.module "rc-menu"] external rcItemClass: ReasonReact.reactClass = "Item";

[@bs.module "rc-menu"]
external rcDividerClass: ReasonReact.reactClass = "Divider";

[%bs.raw {|require("rc-menu/assets/index.css")|}];

module Styles = {
  open Css;
  let menuBorderRadius = `px(3);
  // Menu general, applied to menu <ul> elements
  global(
    ".ft-menu-general, .ft-submenu-general>ul",
    [
      fontFamily(Settings.Text.standardFont),
      listStyleType(`none),
      position(`relative),
      outlineStyle(`none),
      borderRadius(menuBorderRadius),
      borderStyle(`none),
      boxShadows([
        Shadow.box(~x=zero, ~y=px(2), ~blur=px(8), rgba(0, 0, 0, 0.15)),
      ]),
      margin(`zero),
      padding2(~v=`px(4), ~h=`zero),
      // This is applied to menu-items, submenu pointers, and dividers
      selector(
        ">li",
        [
          // Used to place icon in submenu item currently
          position(`relative),
          display(`block),
          clear(`both),
          whiteSpace(`nowrap),
          cursor(`default),
        ],
      ),
      // Taken from default stylesheet, might prevent some small bug
      // with border radius
      selector(
        ">li.ft-menu-item-general:first-child",
        [
          borderTopLeftRadius(menuBorderRadius),
          borderTopRightRadius(menuBorderRadius),
        ],
      ),
    ],
  );

  // Applied to div of submenu
  global(
    ".ft-submenu-general",
    [position(`absolute), minWidth(`px(100))],
  );

  /**
   * Create style for menu tied to a "prefixCls"
   * This function injects global styles for
   * classNames based on prefixCls. It is meant
   * to be called only once per prefix, for example
   * on a module level.
   * For an example, see DropdownMenu
   */
  let createStyle =
      (
        ~prefixCls,
        ~itemVerticalPadding,
        ~itemHorizontalPadding,
        ~textColor,
        ~bgColor,
        ~hoverColor,
        ~textSize,
        ~textLineHeight,
        (),
      ) => {
    let prefixPlus = ext => "." ++ prefixCls ++ "-" ++ ext;

    // Root
    // Dropdown root element. This, like submenu popups, are placed
    // in generated divs right inside document body element. Ie only
    // influenced by top level styles.
    // Note that submenus get their own top level element, so this
    // does not apply to submenus
    // Note: There is a style in Dropdown that takes care
    // of position absolute and zindex
    //global("." ++ prefixCls, []);

    // Menu ul
    // <ul> element that contain the menu items in it's <li>'s
    // Both root menu and submenus have this class.
    // This ul element will receive the -hidden class when hidden
    // Move from Menu.Styles > "ft-menu-general" when styles
    // need variation
    global(
      "ul" ++ prefixPlus("menu"),
      [
        lineHeight(textLineHeight),
        backgroundColor(bgColor),
        // Menu-item
        selector(
          "li" ++ prefixPlus("menu-item"),
          [
            fontSize(textSize),
            color(textColor),
            selector(":hover", [backgroundColor(hoverColor)]),
            padding2(
              ~v=`px(itemVerticalPadding),
              ~h=`px(itemHorizontalPadding),
            ),
            // Reversing outside element padding and adding it on the <a>
            // Not sure how needed this will be (taken from ant)
            selector(
              ">a",
              [
                display(`block),
                margin2(
                  ~v=`px(- itemVerticalPadding),
                  ~h=`px(- itemHorizontalPadding),
                ),
                padding2(
                  ~v=`px(itemVerticalPadding),
                  ~h=`px(itemHorizontalPadding),
                ),
              ],
            ),
          ],
        ),
        // Submenu <li> pointer
        selector(
          ">li" ++ prefixPlus("menu-submenu"),
          [
            fontSize(textSize),
            color(textColor),
            selector(":hover", [backgroundColor(hoverColor)]),
          ],
        ),
        selector(
          ">li" ++ prefixPlus("menu-submenu-active"),
          [backgroundColor(hoverColor)],
        ),
        // Divider
        // Can't move to general because the selector
        // is prefix specific
        selector(
          ">li" ++ prefixPlus("menu-item-divider"),
          [
            margin2(~v=`px(4), ~h=`zero),
            height(`px(1)),
            backgroundColor(`hex("e5e5e5")), // A little lighter than border I think
            lineHeight(`zero),
            overflow(`hidden),
            padding(`zero),
          ],
        ),
      ],
    );

    // Hidden menu
    // Class applied to submenu <ul>'s when menu is hidden. Elements are not initially
    // hidden, but added to the dom on demand. Therefore it is quirky to rely
    // on this class with regards to animations/transitions.
    // For transitions, see api of rc-dropdown/rc-menu
    global(prefixPlus("menu-hidden"), [display(`none)]);
    // Hidden root menu
    global(prefixPlus("hidden"), [display(`none)]);

    // Submenu
    // Submenu has a title element inside a div, and
    // a right arrow added with unicode
    global(
      prefixPlus("menu-submenu-title"),
      [
        padding4(
          ~top=`px(itemVerticalPadding),
          ~right=`px(itemHorizontalPadding * 2 + 5),
          ~bottom=`px(itemVerticalPadding),
          ~left=`px(itemHorizontalPadding),
        ),
      ],
    );
    global(
      prefixPlus("menu-submenu-arrow"),
      [
        position(`absolute),
        right(`px(itemHorizontalPadding)),
        selector(
          "::before",
          [
            color(Settings.textMedium),
            fontStyle(`normal),
            fontSize(`em(0.7)),
            // One option here is to use font-awesome,
            // don't know how much use it would be elsewhere or how to do this,
            // rc-menu does this by default
            contentRule({js|\u25B6|js}),
          ],
        ),
      ],
    );
  };
};

module SubMenu = {
  // https://github.com/react-component/menu#menusubmenu-props
  [@bs.deriving abstract]
  type jsProps = {
    title: string,
    popupClassName: string,
  };

  [@react.component]
  let make = (~title, ~children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=rcSubMenuClass,
      ~props=jsProps(~title, ~popupClassName="ft-submenu-general"),
      children,
    )
    |> ReasonReact.element;
};

module Item = {
  // https://github.com/react-component/menu#menuitem-props
  [@bs.deriving abstract]
  type jsProps = {
    disabled: bool,
    itemIcon: Js.Undefined.t(React.element),
    className: string,
  };

  [@react.component]
  let make = (~disabled=false, ~itemIcon=None, ~children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=rcItemClass,
      ~props=
        jsProps(
          ~disabled,
          ~itemIcon=Js.Undefined.fromOption(itemIcon),
          ~className="ft-menu-item-general",
        ),
      children,
    )
    |> ReasonReact.element;
};

module Divider = {
  // https://github.com/react-component/menu#menuitem-props

  [@react.component]
  let make = (~children=ReasonReact.null) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=rcDividerClass,
      ~props=Js.Obj.empty(),
      children,
    )
    |> ReasonReact.element;
};

type callbackType =
  Js.Undefined.t(
    {
      .
      "key": string,
      "item": React.element,
      "domEvent": Dom.event,
      "keyPath": array(string),
    } =>
    unit,
  );

// https://github.com/react-component/menu#menu-props
[@bs.deriving abstract]
type jsProps = {
  // Gave some namespace confusion on some call site
  // Possibly we could slim the callbacks a little
  // if there are unneeded arguments
  [@bs.as "onClick"]
  jsOnClick: callbackType,
  selectable: bool,
  selectedKeys: array(string),
  [@bs.as "onSelect"]
  jsOnSelect: callbackType,
  className: string,
};

type clickInfo = {
  key: string,
  item: React.element,
  domEvent: Dom.event,
  keyPath: array(string),
};

/**
 * Menu component and sibling components provides a way to define menu items,
 * submenues and dividers. One can register an onClick callback on the
 * <Menu> element to receive information about clicks.
 *
 * To resolve which menu item was clicked, the best way is probably
 * to provide a key attribute to the items, then use the key in
 * the callback. There is also a keyPath list with parents keys
 * in the case of a submenu, the dom Event and the react element
 * that was clicked.
 *
 * The menu could also act more like a select element, as implemented
 * in DropdownSelect.
 *
 * Usage:
 * ```
 * Menu.(
 *   <Menu onClick={info => Js.log(info.key)}>
 *     <Item key="item1"> { "Item 1" |> React.string } </Item>
 *     <SubMenu title="Submenu">
 *       <Item key="subitem1"> { "Subitem 1" |> React.string } </Item>
 *       <Divider />
 *       <Item key="subitem2"> { "Subitem 2" |> React.string } </Item>
 *     </SubMenu>
 *   </Menu>
 * )
 * ```
 */
[@react.component]
let make =
    (~onClick=?, ~selectable=false, ~onSelect=?, ~selectedKey=?, ~children) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=rcMenuClass,
    ~props=
      jsProps(
        ~jsOnClick=
          switch (onClick) {
          | Some(onClick) =>
            Js.Undefined.return(info =>
              onClick({
                key: info##key,
                item: info##item,
                domEvent: info##domEvent,
                keyPath: info##keyPath,
              })
            )
          | None => Js.Undefined.empty
          },
        ~selectable,
        ~jsOnSelect=
          switch (onSelect) {
          | Some(onSelect) =>
            Js.Undefined.return(info =>
              onSelect({
                key: info##key,
                item: info##item,
                domEvent: info##domEvent,
                keyPath: info##keyPath,
              })
            )
          | None => Js.Undefined.empty
          },
        ~selectedKeys=
          switch (selectedKey) {
          | None => [||]
          | Some(key) => [|key|]
          },
        ~className="ft-menu-general",
      ),
    children,
  )  /* Menu item group is not implemented (https://react-component.github.io/menu/examples/menuItemGroup.html*/
  |> ReasonReact.element;
