import { HexColorInput, HexColorPicker } from "react-colorful";
import { Control, Controller, FieldValues } from "react-hook-form";

import { Dropdown, DropdownMenu } from "../index.js";
import { Props as InputItemProps } from "./InputItem.js";
import { Labeled } from "./Labeled.js";

export function ColorInput<T extends FieldValues>({
  name,
  label,
  control,
  disabled,
}: Omit<InputItemProps<T>, "type" | "register" | "placeholder"> & {
  control: Control<T>;
}) {
  const input = (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Dropdown
          render={({ close }) => (
            <DropdownMenu>
              <div
                className="flex flex-col items-center p-1"
                onDoubleClick={close}
              >
                <HexColorPicker color={field.value} onChange={field.onChange} />
                <HexColorInput
                  color={field.value}
                  onChange={field.onChange}
                  prefixed
                  className="w-20 px-1 py-0 mt-1 bg-slate-100 border border-gray-300 outline-indigo-500 text-sm"
                />
              </div>
            </DropdownMenu>
          )}
        >
          <div className="w-10 h-10 rounded p-1 border border-slate-200">
            <div
              style={{ backgroundColor: field.value }}
              className="w-full h-full rounded"
            />
          </div>
        </Dropdown>
      )}
    />
  );

  return label === undefined ? (
    input
  ) : (
    <Labeled label={label} disabled={disabled}>
      {input}
    </Labeled>
  );
}
