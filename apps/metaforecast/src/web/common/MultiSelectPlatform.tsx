import chroma from "chroma-js";
import React, { FC } from "react";
import Select, { StylesConfig } from "react-select";

import { PlatformConfig } from "@/backend/types";

type Option = {
  value: string;
  label: string;
  color: string;
};

const colorStyles: StylesConfig<Option> = {
  control: (styles) => ({ ...styles, backgroundColor: "white" }),
  option: (styles, { data, isDisabled, isFocused, isSelected }) => {
    const color = chroma(data.color);

    return {
      ...styles,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? data.color
        : isFocused
        ? color.alpha(0.1).css()
        : undefined,
      color: isDisabled
        ? "#ccc"
        : isSelected
        ? chroma.contrast(color, "white") > 2
          ? "white"
          : "black"
        : data.color,
      cursor: isDisabled ? "not-allowed" : "default",

      ":active": {
        ...styles[":active"],
        backgroundColor: !isDisabled
          ? isSelected
            ? data.color
            : color.alpha(0.3).css()
          : undefined,
      },
    };
  },
  multiValue: (styles, { data }) => {
    const color = chroma(data.color);
    return {
      ...styles,
      backgroundColor: color.alpha(0.1).css(),
    };
  },
  multiValueLabel: (styles, { data }) => ({
    ...styles,
    color: data.color,
  }),
  multiValueRemove: (styles, { data }) => ({
    ...styles,
    color: data.color,
    ":hover": {
      backgroundColor: data.color,
      color: "white",
    },
  }),
};

type Props = {
  onChange: (platforms: string[]) => void;
  value: string[];
  platformsConfig: PlatformConfig[];
};

export const MultiSelectPlatform: FC<Props> = ({
  onChange,
  value,
  platformsConfig,
}) => {
  const options: Option[] = platformsConfig.map((platform) => ({
    value: platform.name,
    label: platform.label,
    color: platform.color,
  }));

  const id2option: { [k: string]: Option } = {};
  for (const option of options) id2option[option.value] = option;

  const selectValue = value.map((v) => id2option[v]).filter((v) => v);

  const onSelectChange = (newValue: readonly Option[]) => {
    onChange(newValue.map((o) => o.value));
  };

  return (
    <Select
      defaultValue={options}
      isMulti
      className="basic-multi-select w-full text-gray-700"
      onChange={onSelectChange}
      closeMenuOnSelect={false}
      options={options}
      value={selectValue}
      styles={colorStyles}
    />
  );
};
