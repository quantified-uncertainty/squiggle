import { clsx } from "clsx";
import { FC } from "react";

import {
  CodeBracketIcon,
  Cog8ToothIcon,
  CommandLineIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  FocusIcon,
  TextTooltip,
  useCloseDropdown,
} from "@quri/ui";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import { CollapsedIcon, ExpandedIcon } from "./icons.js";
import { getChildrenValues, pathAsString } from "./utils.js";
import {
  useFocus,
  useHasLocalSettings,
  useIsFocused,
  useSetCollapsed,
  useUnfocus,
  useViewerContext,
} from "./ViewerProvider.js";

const FindInEditorItem: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const { editor } = useViewerContext();
  const closeDropdown = useCloseDropdown();

  if (!editor || value.context.path.isRoot()) {
    return null;
  }

  const findInEditor = () => {
    const location = value.context.findLocation();
    editor?.scrollTo(location.start.offset);
    closeDropdown();
  };

  return (
    <DropdownMenuActionItem
      title="Show in Editor"
      icon={CodeBracketIcon}
      onClick={findInEditor}
    />
  );
};

const FocusItem: FC<{ value: SqValueWithContext }> = ({ value }) => {
  const { path } = value.context;
  const isFocused = useIsFocused(path);
  const focus = useFocus();
  const unfocus = useUnfocus();
  if (path.isRoot()) {
    return null;
  }

  if (isFocused) {
    return (
      <DropdownMenuActionItem
        title="Unfocus"
        icon={FocusIcon}
        onClick={unfocus}
      />
    );
  } else {
    return (
      <DropdownMenuActionItem
        title="Focus"
        icon={FocusIcon}
        onClick={() => focus(path)}
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
          variable: pathAsString(value.context.path),
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

  const hasLocalSettings = useHasLocalSettings(value.context.path);

  return (
    <TextTooltip text="Settings" placement="bottom-end">
      <Dropdown
        render={() => (
          <DropdownMenu>
            <FindInEditorItem value={value} />
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
          size={16}
          className={clsx(
            "cursor-pointer transition",
            hasLocalSettings
              ? "text-indigo-300 hover:!text-indigo-500 group-hover:text-indigo-400"
              : "text-stone-100 hover:!text-stone-500 group-hover:text-stone-400"
          )}
        />
      </Dropdown>
    </TextTooltip>
  );
};
