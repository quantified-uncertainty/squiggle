import { FieldValues } from "react-hook-form";
import { InputItem, Props as InputItemProps } from "./InputItem.js";

export function ColorInput<T extends FieldValues>(
  props: Omit<InputItemProps<T>, "type">
) {
  return <InputItem {...props} type="color" />;
}
