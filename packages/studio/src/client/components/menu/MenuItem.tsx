import { clsx } from "clsx";
import {
  ButtonHTMLAttributes,
  FC,
  forwardRef,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";

import { CheckIcon, ChevronRightIcon } from "@quri/ui";

import { TID } from "../../../shared/testIds.js";
import type {
  ResolvedCommandItem,
  ResolvedPlaceholder,
  ResolvedSubmenu,
} from "./resolveMenu.js";

// One row of a menu (§3.3 "Look"): a left gutter for the check or radio dot,
// the label (plus a dim detail such as a folder hint), and the shortcut.

export const ITEM_CLASS =
  "group mx-1 flex h-7 w-[calc(100%-0.5rem)] select-none items-center gap-2 rounded px-2 text-left text-[13px] text-slate-700 outline-none data-[active=true]:bg-blue-100 data-[active=true]:text-slate-900 aria-disabled:text-slate-400";

const DIM_CLASS =
  "text-slate-500 group-data-[active=true]:text-slate-600 group-aria-disabled:text-slate-400";

type RowEvents = {
  index: number;
  active: boolean;
  onHover: (index: number, e: ReactPointerEvent<HTMLElement>) => void;
};

const Gutter: FC<{ item: ResolvedCommandItem | ResolvedSubmenu }> = ({
  item,
}) => (
  <span aria-hidden="true" className="grid w-4 shrink-0 place-items-center">
    {item.kind === "command" && item.checked ? (
      item.role === "menuitemradio" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : (
        <CheckIcon size={14} />
      )
    ) : null}
  </span>
);

const Label: FC<{ label: string; detail?: ReactNode; struck?: boolean }> = ({
  label,
  detail,
  struck,
}) => (
  <span className={clsx("min-w-0 flex-1 truncate", struck && "line-through")}>
    {label}
    {detail}
  </span>
);

type CommandRowProps = RowEvents & {
  item: ResolvedCommandItem;
  onActivate: (item: ResolvedCommandItem) => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

export const MenuItem = forwardRef<HTMLButtonElement, CommandRowProps>(
  function MenuItem(
    { item, index, active, onHover, onActivate, ...rest },
    ref
  ) {
    return (
      <button
        {...rest}
        ref={ref}
        type="button"
        role={item.role}
        aria-checked={
          item.role === "menuitem" ? undefined : Boolean(item.checked)
        }
        aria-disabled={item.enabled ? undefined : true}
        aria-keyshortcuts={item.ariaKeyshortcuts}
        data-testid={TID.menuitem}
        data-command={item.command}
        data-args={
          item.args === undefined ? undefined : JSON.stringify(item.args)
        }
        data-active={active}
        data-index={index}
        tabIndex={active ? 0 : -1}
        className={ITEM_CLASS}
        onPointerMove={(e) => onHover(index, e)}
        onClick={(e) => {
          e.preventDefault();
          if (item.enabled) onActivate(item);
        }}
      >
        <Gutter item={item} />
        <Label
          label={item.label}
          struck={item.struck}
          detail={
            item.detail ? (
              <span
                className={DIM_CLASS}
                data-volatile={item.volatile ? "" : undefined}
              >
                {` · ${item.detail}`}
              </span>
            ) : undefined
          }
        />
        {item.shortcut && (
          <kbd className={clsx("ml-8 shrink-0 font-sans text-xs", DIM_CLASS)}>
            {item.shortcut}
          </kbd>
        )}
      </button>
    );
  }
);

type SubmenuRowProps = RowEvents & {
  item: ResolvedSubmenu;
  expanded: boolean;
  onOpen: () => void;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;

// The row that opens a submenu (`aria-haspopup`, a chevron).
export const SubmenuTriggerItem = forwardRef<
  HTMLButtonElement,
  SubmenuRowProps
>(function SubmenuTriggerItem(
  { item, index, active, expanded, onHover, onOpen, ...rest },
  ref
) {
  return (
    <button
      {...rest}
      ref={ref}
      type="button"
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={expanded}
      data-testid={TID.menuitem}
      data-submenu={item.id}
      data-active={active || expanded}
      data-index={index}
      tabIndex={active ? 0 : -1}
      className={ITEM_CLASS}
      onPointerMove={(e) => onHover(index, e)}
      onClick={(e) => {
        e.preventDefault();
        onOpen();
      }}
    >
      <Gutter item={item} />
      <Label label={item.label} />
      <ChevronRightIcon size={14} className={DIM_CLASS} />
    </button>
  );
});

// A disabled row that only informs ("No recent items").
export const MenuPlaceholder: FC<{ item: ResolvedPlaceholder }> = ({
  item,
}) => (
  <div
    role="menuitem"
    aria-disabled="true"
    tabIndex={-1}
    data-placeholder=""
    className={ITEM_CLASS}
  >
    <span aria-hidden="true" className="w-4 shrink-0" />
    <Label label={item.label} />
  </div>
);

export const MenuSeparator: FC = () => (
  <div role="separator" className="my-1 h-px bg-slate-200" />
);

export const MenuHeader: FC<{ label: string }> = ({ label }) => (
  <div
    aria-hidden="true"
    className="select-none px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
  >
    {label}
  </div>
);
