import { FC } from "react";

import {
  CodeBracketIcon,
  Cog8ToothIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  EmptyIcon,
  TextTooltip,
  useCloseDropdown,
} from "@quri/ui";

import { SqValueWithContext } from "../../lib/utility.js";
import { widgetRegistry } from "../../widgets/registry.js";
import {
  useHasLocalSettings,
  useSetCollapsed,
  useViewerContext,
} from "./ViewerProvider.js";
import { getChildrenValues } from "./utils.js";
import { clsx } from "clsx";

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

const SetChildrenCollapsedStateItem: FC<{
  value: SqValueWithContext;
  title: string;
  collapsed: boolean;
}> = ({ value, title, collapsed }) => {
  const setCollapsed = useSetCollapsed();
  const closeDropdown = useCloseDropdown();

  if (value.tag !== "Array" && value.tag !== "Dict") {
    return null;
  }

  const act = () => {
    for (const childValue of getChildrenValues(value)) {
      if (!childValue.context) {
        // shouldn't happen, but getChildrenValues doesn't infer that if `value` has context then its children must have it too
        continue;
      }
      setCollapsed(childValue.context.path, collapsed);
    }
    closeDropdown();
  };

  return (
    <DropdownMenuActionItem title={title} onClick={act} icon={EmptyIcon} />
  );
};

export const SquiggleValueSettingsMenu: FC<{
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
