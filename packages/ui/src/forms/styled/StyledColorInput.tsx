"use client";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { Dropdown } from "../../components/Dropdown/index.js";
import { DropdownMenu } from "../../components/Dropdown/DropdownMenu.js";

type Props = {
  value: string;
  onChange: (newValue: string) => void;
};

export function StyledColorInput({ value, onChange }: Props) {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <div className="flex flex-col items-center p-2" onDoubleClick={close}>
            <HexColorPicker color={value} onChange={onChange} />
            <HexColorInput
              color={value}
              onChange={onChange}
              prefixed
              className="w-20 px-1 py-0 mt-1 bg-slate-100 border border-gray-300 outline-indigo-500 text-sm"
            />
          </div>
        </DropdownMenu>
      )}
    >
      <div className="w-10 h-10 rounded p-1 border border-slate-200">
        <div
          style={{ backgroundColor: value }}
          className="w-full h-full rounded"
        />
      </div>
    </Dropdown>
  );
}
