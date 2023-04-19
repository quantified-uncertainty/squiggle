import React from "react";
import * as yup from "yup";

import { InputItem } from "../ui/InputItem.js";
import { Text } from "../ui/Text.js";
import { viewSettingsSchema } from "../ViewSettingsForm.js";
import { UseFormRegister } from "react-hook-form";

export const playgroundSettingsSchema = yup
  .object({})
  .shape({
    sampleCount: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(1000000),
    xyPointLength: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(10000),
  })
  .concat(viewSettingsSchema);

export type PlaygroundFormFields = yup.InferType<
  typeof playgroundSettingsSchema
>;

export const EnvironmentSettingsForm: React.FC<{
  register: UseFormRegister<PlaygroundFormFields>;
}> = ({ register }) => (
  <div className="space-y-6 p-3 max-w-xl">
    <div>
      <InputItem
        name="sampleCount"
        type="number"
        label="Sample Count"
        register={register}
      />
      <div className="mt-2">
        <Text>
          How many samples to use for Monte Carlo simulations. This can
          occasionally be overridden by specific Squiggle programs.
        </Text>
      </div>
    </div>
    <div>
      <InputItem
        name="xyPointLength"
        type="number"
        register={register}
        label="Coordinate Count (For PointSet Shapes)"
      />
      <div className="mt-2">
        <Text>
          When distributions are converted into PointSet shapes, we need to know
          how many coordinates to use.
        </Text>
      </div>
    </div>
  </div>
);
