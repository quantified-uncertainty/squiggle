"use client";

import { useEffect, useMemo } from "react";

export type Shortcut = {
  metaKey?: boolean;
  shiftKey?: boolean;
  key: string;
};

//TODO: Make sure that keyboard shortcut only works when exact modifiers are pressed. This means checking for altKey and controlKey as well.
function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  if (
    (shortcut.shiftKey ?? false) !== event.shiftKey ||
    (shortcut.metaKey ?? false) !== event.metaKey ||
    event.key.toLowerCase() !== shortcut.key.toLowerCase()
  ) {
    return false;
  }
  return true;
}

export function useGlobalShortcuts(shortcuts: [Shortcut, () => void][]) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      shortcuts.forEach(([shortcut, act]) => {
        if (eventMatchesShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          act();
        }
      });
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
    // Since `shortcuts` is an array and could be a new array on every render,
    // memoize it to prevent unnecessary effect executions. That said, this should run quickly anyway.
  }, [shortcuts]);
}

export function useGlobalShortcut(shortcut: Shortcut, act: () => void) {
  // Explicitly type the memoized value to ensure it's recognized as an array of [Shortcut, () => void] tuples
  const shortcuts = useMemo<[Shortcut, () => void][]>(
    () => [[shortcut, act]], // This creates an array of one tuple, ensuring the correct type structure
    [shortcut, act]
  );

  useGlobalShortcuts(shortcuts);
}
