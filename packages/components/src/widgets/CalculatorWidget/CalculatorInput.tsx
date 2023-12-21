import { FC } from "react";

import { SqInput } from "@quri/squiggle-lang";
import {
  CheckboxFormField,
  SelectStringFormField,
  TextAreaFormField,
  TextFormField,
} from "@quri/ui";

import { PlaygroundSettings } from "../../components/PlaygroundSettings.js";
import { SquiggleValueResultChart } from "../../components/SquiggleViewer/SquiggleValueResultViewer.js";
import { SqValueResult } from "./types.js";

export const CalculatorInput: FC<{
  id: number;
  input: SqInput;
  result: SqValueResult | undefined;
  settings: PlaygroundSettings;
}> = ({ id, input, result, settings }) => {
  const { name, typeName, description } = input;

  const newDescription = [typeName, description].filter((e) => e).join("\n\n");
  // common props for all *FormField components
  const commonProps = {
    name: `inputs.${id}` as const,
    label: name,
    description: newDescription,
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
            options={[...input.options]}
            size="small"
            required
          />
        )}
      </div>
      {result && !result.ok && (
        <SquiggleValueResultChart result={result} settings={settings} />
      )}
    </div>
  );
};
