import { clsx } from "clsx";
import { KeyboardEvent, ReactNode, useRef } from "react";

export type SegmentedOption<T extends string> = {
  value: T;
  label: ReactNode;
  tooltip?: string; // title, e.g. "Output (⌘K 1)"
  disabled?: boolean;
  testId?: string;
  attrs?: Record<`data-${string}`, string>; // e.g. {"data-view": "output"}
};

type Props<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  label: string; // accessible name of the group
  // "tablist" for the view switcher (with aria-controls), "radiogroup" for
  // option toggles (Cards/List, List/Grid/Plot), §6.5.
  role?: "tablist" | "radiogroup";
  controls?: string; // id of the panel, for role "tablist"
  testId?: string;
  className?: string;
};

// The one segmented control (§3.11): the view switcher, Output's Cards/List
// and RV's List/Grid/Plot. ←/→ move between options (roving tab stop).
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  role = "radiogroup",
  controls,
  testId,
  className,
}: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = options.filter((o) => !o.disabled);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const focusIndex =
    selectedIndex !== -1 && !options[selectedIndex].disabled
      ? selectedIndex
      : options.findIndex((o) => !o.disabled);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const current = enabled.findIndex((o) => o.value === value);
    let next = current;
    if (e.key === "ArrowLeft")
      next = (current - 1 + enabled.length) % enabled.length;
    if (e.key === "ArrowRight") next = (current + 1) % enabled.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = enabled.length - 1;
    const option = enabled[next];
    if (!option) return;
    onChange(option.value);
    refs.current[options.indexOf(option)]?.focus();
  };

  return (
    <div
      role={role}
      aria-label={label}
      data-testid={testId}
      className={clsx(
        "inline-flex h-6 shrink-0 items-center rounded-md bg-slate-100 p-0.5 text-xs",
        className
      )}
      onKeyDown={onKeyDown}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role={role === "tablist" ? "tab" : "radio"}
            aria-selected={role === "tablist" ? selected : undefined}
            aria-checked={role === "radiogroup" ? selected : undefined}
            aria-controls={role === "tablist" ? controls : undefined}
            tabIndex={i === focusIndex ? 0 : -1}
            title={option.tooltip}
            disabled={option.disabled}
            data-testid={option.testId}
            {...option.attrs}
            className={clsx(
              "h-5 rounded px-2 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300",
              selected
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900",
              option.disabled && "cursor-default text-slate-400"
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
