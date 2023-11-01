import { FC } from "react";

import { SqInput } from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  SelectStringFormField,
  TextAreaFormField,
  TextFormField,
} from "@quri/ui";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import { SqValueResult } from "./types.js";

export const CalculatorInput: FC<{
  input: SqInput;
  result: SqValueResult | undefined;
  settings: PlaygroundSettings;
}> = ({ input, result, settings }) => {
  const { name, description } = input;

  // common props for all *FormField components
  const commonProps = {
    name,
    label: name,
    description,
  };

  return (
    <div className="flex flex-col">
      <div className="flex-grow max-w-sm">
        {input.tag === "text" && (
          <TextFormField
            {...commonProps}
            placeholder={`Enter code for ${name}`}
            size="small"
          />
        )}
        {input.tag === "textArea" && (
          <TextAreaFormField
            {...commonProps}
            placeholder={`Enter code for ${name}`}
          />
        )}
        {input.tag === "checkbox" && <CheckboxFormField {...commonProps} />}
        {input.tag === "select" && (
          <SelectStringFormField
            {...commonProps}
            options={input.options}
            size="small"
            required
          />
        )}
      </div>
      {result && !result.ok && (
        <ValueResultViewer result={result} settings={settings} />
      )}
    </div>
  );
};
