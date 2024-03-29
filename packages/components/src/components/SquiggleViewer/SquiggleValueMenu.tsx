import { clsx } from "clsx";
import { FC } from "react";

import {
  Cog8ToothIcon,
  CommandLineIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  DropdownMenuHeader,
  FocusIcon,
  useCloseDropdown,
} from "@quri/ui";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import { valueToHeadingString } from "../../widgets/utils.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { getChildrenValues } from "./utils.js";
import {
  useHasLocalSettings,
  useIsZoomedIn,
  useSetCollapsed,
  useViewerContext,
  useZoomIn,
  useZoomOut,
} from "./ViewerProvider.js";

const FocusItem: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const { path } = value.context;
  const isFocused = useIsZoomedIn(path);
  const zoomIn = useZoomIn();
  const zoomOut = useZoomOut();
  if (path.isRoot()) {
    return null;
  }

  if (isFocused) {
    return (
      <DropdownMenuActionItem
        title="Zoom Out"
        icon={FocusIcon}
        onClick={zoomOut}
      />
    );
  } else {
    return (
      <DropdownMenuActionItem
        title="Zoom In"
        icon={FocusIcon}
        onClick={() => zoomIn(path)}
      />
    );
  }
};

const LogToConsoleItem: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const closeDropdown = useCloseDropdown();

  return (
    <DropdownMenuActionItem
      title="Log to JS Console"
      icon={CommandLineIcon}
      onClick={() => {
        // eslint-disable-next-line no-console
        console.log({
          variable: value.context.path.uid(),
          value: value._value,
          context: value.context,
        });
        closeDropdown();
      }}
    />
  );
};

const SetChildrenCollapsedStateItem: FC<{
  value: SqValueWithContext;
  title: string;
  collapsed: boolean;
}> = ({ value, title, collapsed }) => {
  const setCollapsed = useSetCollapsed();
  const closeDropdown = useCloseDropdown();

  const { itemStore } = useViewerContext();

  if (value.tag !== "Array" && value.tag !== "Dict") {
    return null;
  }

  const childrenValues = getChildrenValues(value);

  const allChildrenInRequiredState = childrenValues.every((childValue) => {
    const childPath = childValue.context?.path;
    return childPath && itemStore.getState(childPath).collapsed === collapsed;
  });
  if (allChildrenInRequiredState) {
    return null; // action won't do anything useful
  }

  const act = () => {
    for (const childValue of childrenValues) {
      if (!childValue.context) {
        // shouldn't happen, but getChildrenValues doesn't infer that if `value` has context then its children must have it too
        continue;
      }
      setCollapsed(childValue.context.path, collapsed);
    }
    closeDropdown();
  };

  const Icon = collapsed ? CollapsedIcon : ExpandedIcon;

  return <DropdownMenuActionItem title={title} onClick={act} icon={Icon} />;
};

export const SquiggleValueMenu: FC<{
  value: SqValueWithContext;
}> = ({ value }) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  const widgetHeading = valueToHeadingString(value);

  const hasLocalSettings = useHasLocalSettings(value.context.path);

  return (
    <Dropdown
      render={() => (
        <DropdownMenu>
          {widgetHeading && (
            <DropdownMenuHeader>{widgetHeading}</DropdownMenuHeader>
          )}
          <FocusItem value={value} />
          <SetChildrenCollapsedStateItem
            value={value}
            title="Collapse Children"
            collapsed={true}
          />
          <SetChildrenCollapsedStateItem
            value={value}
            title="Expand Children"
            collapsed={false}
          />
          {widget?.Menu && <widget.Menu value={value} />}
          <LogToConsoleItem value={value} />
        </DropdownMenu>
      )}
    >
      <Cog8ToothIcon
        size={14}
        className={clsx(
          "cursor-pointer transition",
          hasLocalSettings
            ? "text-indigo-300 hover:!text-indigo-500 group-hover:text-indigo-400"
            : "opacity-0 hover:!text-slate-500 group-hover:text-slate-400 group-hover:opacity-100"
        )}
      />
    </Dropdown>
  );
};
