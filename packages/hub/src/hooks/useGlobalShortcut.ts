import { useEffect } from "react";

type Shortcut = {
  metaKey?: boolean;
  key: string;
};

function eventMatchesShortcut(event: KeyboardEvent, shortcut: Shortcut) {
  return (
    event.key === shortcut.key && event.metaKey === (shortcut.metaKey ?? false)
  );
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
