import { FC } from "react";
import { useFormContext } from "react-hook-form";

import { SqInput } from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  SelectStringFormField,
  TextAreaFormField,
  TextFormField,
} from "@quri/ui";

import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { ValueResultViewer } from "./ValueResultViewer.js";
import { SqValueResult } from "./index.js";

export const CalculatorInput: FC<{
  input: SqInput;
  result: SqValueResult | undefined;
  settings: PlaygroundSettings;
}> = ({ input, result, settings }) => {
  const form = useFormContext();
  const { name, description } = input;

  const code = form.getValues(input.name);

  return (
    <div className="flex flex-col mb-2">
      <div className="text-sm font-medium text-gray-800">{name}</div>
      {description && (
        <div className="text-sm text-gray-400">{description}</div>
      )}

      <div className="flex-grow mt-1 max-w-xs">
        {input.tag === "text" && (
          <TextFormField
            name={name}
            placeholder={`Enter code for ${name}`}
            size="small"
          />
        )}
        {input.tag === "textArea" && (
          <TextAreaFormField
            name={name}
            placeholder={`Enter code for ${name}`}
          />
        )}
        {input.tag === "checkbox" && <CheckboxFormField name={name} />}
        {input.tag === "select" && (
          <SelectStringFormField name={name} options={input.options} required />
        )}
      </div>
      {result && !result.ok && code !== "" && (
        <ValueResultViewer result={result} settings={settings} />
      )}
    </div>
  );
};
