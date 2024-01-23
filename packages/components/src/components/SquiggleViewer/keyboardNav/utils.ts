import { SqValuePath } from "@quri/squiggle-lang";

import { ItemStore } from "../ViewerProvider.js";

export const focusSqValueHeader = (path: SqValuePath, itemStore: ItemStore) => {
  const header = itemStore.handles[path.uid()]?.element.querySelector("header");
  if (header) {
    header.focus();
  }
};

export function isValidKey<T extends readonly string[]>(
  key: string,
  validKeys: T
): key is T[number] {
  return validKeys.includes(key as T[number]);
}

type KeyHandler = (eventKey: string) => void;

// Returns boolean to indicate if the key was handled. The caller might want to do something else if it wasn't.
export function keyboardEventHandler<T extends readonly string[]>(
  validKeys: T,
  handlers: Partial<Record<T[number], KeyHandler>>
) {
  return (event: React.KeyboardEvent<HTMLElement>) =>
    ((eventKey: string): boolean => {
      if (isValidKey(eventKey, validKeys)) {
        const handler = handlers[eventKey];
        event.preventDefault();
        if (handler) {
          handler(eventKey);
        }
        return true;
      }
      return false;
    })(event.key);
}
