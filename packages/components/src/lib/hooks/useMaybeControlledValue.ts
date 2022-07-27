import { useState } from "react";

type ControlledValueArgs<T> = {
  value?: T;
  defaultValue: T;
  onChange?: (x: T) => void;
};

export function useMaybeControlledValue<T>(
  args: ControlledValueArgs<T>
): [T, (x: T) => void] {
  let [uncontrolledValue, setUncontrolledValue] = useState(args.defaultValue);
  let value = args.value ?? uncontrolledValue;
  let onChange = (newValue: T) => {
    if (args.value === undefined) {
      // uncontrolled mode
      setUncontrolledValue(newValue);
    }
    args.onChange?.(newValue);
  };
  return [value, onChange];
}
