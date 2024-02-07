"use client";

import { useEffect } from "react";

export type Shortcut = {
  metaKey?: boolean;
  shiftKey?: boolean;
  key: string;
};

function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  if (
    (shortcut.shiftKey && !event.shiftKey) ||
    (shortcut.metaKey && !event.metaKey) ||
    event.key.toLowerCase() !== shortcut.key.toLowerCase()
  ) {
    return false;
  }
  return true;
}

export function useGlobalShortcut(shortcut: Shortcut, act: () => void) {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (eventMatchesShortcut(event, shortcut)) {
        event.preventDefault();
        event.stopPropagation();
        act();
      }
    };

    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [shortcut, act]);
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
    // it's important to ensure that it's memoized or stable to prevent unnecessary effect executions.
    // If it's not stable, consider using a state management solution or memoizing the input.
  }, [shortcuts]);
}
