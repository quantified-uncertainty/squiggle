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
  const sent = useRef(search);
  useEffect(() => {
    if (search !== sent.current) {
      sent.current = search;
      setValue(search);
    }
  }, [search]);

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
      onChange={(event) => {
        const next = event.currentTarget.value;
        setValue(next);
        sent.current = next;
        startTransition(() => {
          core.dispatch({ type: "setSearch", search: next }, "user");
        });
      }}
    />
  );
};
