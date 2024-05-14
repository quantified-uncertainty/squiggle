import { Switch } from "@headlessui/react";
import clsx from "clsx";

export type StyledToggleProps = {
  checked: boolean;
  showFocusRing?: boolean;
  size?: "medium" | "tiny";
  onChange(newValue: boolean): void;
};

export function StyledToggle({
  checked,
  showFocusRing = true,
  size = "medium",
  onChange,
}: StyledToggleProps) {
  const sizeClasses = {
    medium: {
      toggle: "h-6 w-11",
      circle: "h-5 w-5",
      translate: "translate-x-5",
    },
    tiny: {
      toggle: "h-3 w-5",
      circle: "h-2 w-2",
      translate: "translate-x-2",
    },
  };

  const { toggle, circle, translate } = sizeClasses[size];

  return (
    <Switch
      checked={checked}
      onChange={onChange}
      className={clsx(
        checked ? "bg-blue-600" : "bg-gray-200",
        `relative inline-flex ${toggle} flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`,
        showFocusRing && "focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
      )}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={clsx(
          checked ? translate : "translate-x-0",
          `pointer-events-none inline-block ${circle} transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`
        )}
      />
    </Switch>
  );
}
