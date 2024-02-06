"use client";

import { useEffect } from "react";

type Shortcut = {
  metaKey?: boolean;
  shiftKey?: boolean;
  key: string;
};

function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  if (
    (shortcut.shiftKey && !event.shiftKey) ||
    (shortcut.metaKey && !event.metaKey)
  ) {
    return false;
  }
  return event.key === shortcut.key;
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
