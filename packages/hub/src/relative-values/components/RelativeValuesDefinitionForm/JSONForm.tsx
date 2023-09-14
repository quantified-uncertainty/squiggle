"use client";
import { ChangeEventHandler, FC, useState } from "react";
import { useFormContext } from "react-hook-form";
import { StyledTextArea } from "@quri/ui";

import { FormShape } from "./FormShape";

export const JSONForm: FC = () => {
  const { setValue, getValues } = useFormContext<FormShape>();

  const [defaultValue] = useState(() =>
    JSON.stringify(
      {
        clusters: getValues("clusters"),
        items: getValues("items"),
        recommendedUnit: getValues("recommendedUnit"),
      },
      null,
      2
    )
  );

  const onChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    const decoded = JSON.parse(e.target.value ?? "");
    // FIXME - must be validated first
    setValue("items", decoded.items);
    setValue("clusters", decoded.clusters);
    setValue("recommendedUnit", decoded.recommendedUnit);
  };

  return (
    <StyledTextArea
      defaultValue={defaultValue}
      onChange={onChange}
      name="json"
    />
  );
};
