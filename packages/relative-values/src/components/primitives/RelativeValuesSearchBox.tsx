"use client";
import clsx from "clsx";
import { FC, useEffect, useRef, useState, useTransition } from "react";

import { useCore } from "../host/core.js";
import { usePresentation } from "../host/presentation.js";

/**
 * The search box (state.search), for host layouts; the list view's toolbar
 * renders one too. Hidden while `search` is locked.
 */
export const RelativeValuesSearchBox: FC<{
  className?: string;
  placeholder?: string;
}> = ({ className, placeholder }) => {
  const core = useCore();
  const { labels } = usePresentation();
  const search = core.state.search;
  // The input updates immediately; the views update in a transition.
  const [value, setValue] = useState(search);
  const [, startTransition] = useTransition();
  // The last value typed, and how many keystrokes were sent / rendered (each
  // keystroke's transition also sets `rendered`).
  const sent = useRef(search);
  const keystrokes = useRef(0);
  const [rendered, setRendered] = useState(0);
  // Once the last keystroke's transition has rendered (and when nothing is
  // in flight), the input shows the effective search: a new value from the
  // host, or the previous one if the host rejected the change (a controlled
  // `search` that it didn't update in `onStateChange`). Earlier keystrokes'
  // renders are skipped, so fast typing never loses characters.
  useEffect(() => {
    if (rendered === keystrokes.current && search !== sent.current) {
      sent.current = search;
      setValue(search);
    }
  }, [search, rendered]);

  if (core.isLocked("search")) {
    return null;
  }
  return (
    <input
      type="text"
      data-rv-part="search"
      className={clsx(
        "rounded-[var(--squiggle-rv-radius,0.25rem)] border border-[color:var(--squiggle-rv-border,#e5e7eb)] p-1",
        className
      )}
      value={value}
      placeholder={placeholder ?? labels["list.searchPlaceholder"]}
      aria-label={labels["list.searchLabel"]}
      onChange={(event) => {
        const next = event.currentTarget.value;
        const keystroke = ++keystrokes.current;
        setValue(next);
        sent.current = next;
        startTransition(() => {
          core.dispatch({ type: "setSearch", search: next }, "user");
          setRendered(keystroke);
        });
      }}
    />
  );
};
