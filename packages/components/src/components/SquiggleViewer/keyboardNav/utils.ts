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
