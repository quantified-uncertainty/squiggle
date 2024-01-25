import { SqValuePath } from "@quri/squiggle-lang";

import { ItemStore } from "../ViewerProvider.js";

export const focusSqValue = (path: SqValuePath, itemStore: ItemStore) => {
  const handle = itemStore.handles[path.uid()];
  if (handle) {
    if (handle.type === "listItem") {
      handle.value.focusOnHeader();
    } else if (handle.type === "cellItem") {
      handle.value.focus();
    }
  }
};

// Returns boolean to indicate if the key was handled. The caller might want to do something else if it wasn't.
export function keyboardEventHandler(
  handlers: Partial<Record<string, () => void>>
) {
  return (event: React.KeyboardEvent<HTMLElement>): boolean => {
    const handler = handlers[event.key];
    if (handler) {
      event.preventDefault();
      handler();
      return true;
    }
    return false;
  };
}
