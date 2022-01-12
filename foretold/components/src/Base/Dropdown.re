/**
 * Dropdown component provides a way to show an overlay element
 * at a position relative to it's trigger element (the children given
 * to this element), on various triggers: Click, Hover, ContextMenu and Focus.
 *
 * It is bindings to https://github.com/react-component/dropdown
 */
[@bs.module "rc-dropdown"]
external rcDropDownClass: ReasonReact.reactClass = "default";

[%bs.raw {|require("rc-dropdown/assets/index.css")|}];

/** On what event to trigger dropdown
 * rc-trigger supports an array of triggers.
 * This is currently not encoded here currently as
 * it was considered a rarer case, many combinations are superfluous,
 * and delayed in interest of simplicity.
 * If there is only one or a few more, one possiblity
 * would be a variant like ClickFocus.
 */
type trigger =
  | Click
  | Hover
  | ContextMenu
  | Focus;

let triggerToString = trigger =>
  switch (trigger) {
  | Click => "click"
  | Hover => "hover"
  | ContextMenu => "contextMenu"
  | Focus => "focus"
  };

/* In the documentation of rc-dropdown, the overlay
   property is specified to be a rc-menu,
   but this doesn't seem to be a hard
   requirement in the source */
[@bs.deriving abstract]
type jsProps = {
  overlay: ReasonReact.reactElement,
  trigger: array(string),
  prefixCls: string,
  overlayClassName: string,
};

module Styles = {
  open Css;
  // Styles are based on a prefixCls given to the element
  // Some styles can be applied to all dropdowns, while
  // others are more specific

  // General
  // First overlay element, this doesn't apply to submenues, but
  // all kinds of direct overlays
  global(
    ".ft-overlay",
    [
      fontFamily(Settings.Text.standardFont),
      fontSize(`rem(1.)),
      lineHeight(`rem(1.0)),
      zIndex(1070),
      position(`absolute),
      left(`px(-9999)),
      top(`px(-9999)),
    ],
  );
};

/**
 * Dropdown component provides a way to show an overlay element
 * at a position relative to it's trigger element (the children given
 * to this element), on various triggers: Click, Hover, ContextMenu and Focus.
 * Can be used for example with the Menu component as overlay
 *
 * Usage:
 * ```
 * let staticOverlay = <div> {"Todo: style" |> React.string} </div>;
 *
 * <Dropdown overlay=staticOverlay trigger=Dropdown.Click>
 *   <div> {"Trigger element" |> React.string} </div>
 * </Dropdown>
 * ```
 */
[@react.component]
let make =
    (
      ~overlay,
      ~trigger=Hover,
      ~prefixCls="rc-dropdown",
      ~children=ReasonReact.null,
    ) =>
  ReasonReact.wrapJsForReason(
    ~reactClass=rcDropDownClass,
    ~props=
      jsProps(
        ~overlay,
        ~trigger=[|triggerToString(trigger)|],
        ~overlayClassName="ft-overlay",
        ~prefixCls,
      ),
    children,
  )
  |> ReasonReact.element;
