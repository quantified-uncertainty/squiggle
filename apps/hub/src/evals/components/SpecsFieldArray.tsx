"use client";

import React, { FC } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button, PlusIcon, TextAreaFormField, TrashIcon } from "@quri/ui";

export const SpecsFieldArray: FC<{ name: string }> = ({ name }) => {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const addEmptyField = () => {
    append({ description: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Specs (at least one is required)
        </label>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start space-x-2">
            <div className="flex-grow">
              <TextAreaFormField
                name={`${name}.${index}.description`}
                placeholder="Enter spec description..."
                rules={{ required: "Description is required" }}
                rows={2}
              />
            </div>
            <button
              type="button"
              onClick={() => remove(index)}
              className="mt-2 text-red-500 hover:text-red-700 disabled:text-gray-300"
              disabled={fields.length === 1}
              aria-label="Remove spec"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <Button onClick={addEmptyField} size="small">
        <PlusIcon className="h-4 w-4" />
        <span>Add Spec</span>
      </Button>
    </div>
  );
};
