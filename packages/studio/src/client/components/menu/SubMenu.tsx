import {
  autoUpdate,
  flip,
  FloatingNode,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useFloating,
  useFloatingNodeId,
  useHover,
  useInteractions,
  useMergeRefs,
} from "@floating-ui/react";
import { FC, PointerEvent as ReactPointerEvent, useId } from "react";

import { type CloseReason, type InitialFocus, MenuPanel } from "./Menu.js";
import { SubmenuTriggerItem } from "./MenuItem.js";
import type { ResolvedCommandItem, ResolvedSubmenu } from "./resolveMenu.js";

type Props = {
  item: ResolvedSubmenu;
  index: number;
  active: boolean;
  open: boolean;
  initialFocus: InitialFocus;
  focusSeq: number; // a new value re-applies initialFocus (→ on an open submenu)
  rootId: string;
  level: number; // of the parent menu
  setRef: (el: HTMLElement | null) => void;
  onHover: (index: number, e: ReactPointerEvent<HTMLElement>) => void;
  onOpenChange: (open: boolean, via: "keyboard" | "pointer") => void;
  onClose: (reason: CloseReason) => void;
  onActivate: (item: ResolvedCommandItem) => void;
  onNavigateOut?: (dir: 1 | -1) => void;
};

// A submenu: the row that opens it and, while open, its panel to the right
// (`right-start`, flipped and shifted to stay on screen). It opens on hover
// after 100 ms and stays open while the pointer travels towards it
// (safePolygon); keys are the parent panel's (→, Enter, Space) and its own.
export const SubMenu: FC<Props> = ({
  item,
  index,
  active,
  open,
  initialFocus,
  focusSeq,
  rootId,
  level,
  setRef,
  onHover,
  onOpenChange,
  onClose,
  onActivate,
  onNavigateOut,
}) => {
  const nodeId = useFloatingNodeId();
  const triggerId = useId();
  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open,
    onOpenChange: (next) => onOpenChange(next, "pointer"),
    placement: "right-start",
    middleware: [
      offset({ mainAxis: 2, alignmentAxis: -5 }),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const hover = useHover(context, {
    delay: { open: 100 },
    handleClose: safePolygon(),
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover]);
  const ref = useMergeRefs([refs.setReference, setRef]);

  return (
    <FloatingNode id={nodeId}>
      <SubmenuTriggerItem
        {...getReferenceProps()}
        ref={ref}
        id={triggerId}
        item={item}
        index={index}
        active={active}
        expanded={open}
        onHover={onHover}
        onOpen={() => onOpenChange(true, "pointer")}
      />
      {open && (
        <FloatingPortal>
          <MenuPanel
            key={focusSeq}
            items={item.items}
            rootId={rootId}
            menuId={item.id}
            labelledBy={triggerId}
            level={level + 1}
            initialFocus={initialFocus}
            floating={{
              setFloating: refs.setFloating,
              style: floatingStyles,
              props: getFloatingProps(),
            }}
            onActivate={onActivate}
            onClose={onClose}
            onNavigateOut={onNavigateOut}
          />
        </FloatingPortal>
      )}
    </FloatingNode>
  );
};
