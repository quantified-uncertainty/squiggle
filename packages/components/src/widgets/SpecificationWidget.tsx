import clsx from "clsx";

import { SqError } from "@quri/squiggle-lang";
import { CheckIcon, CubeTransparentIcon, XIcon } from "@quri/ui";

import { SqSpecification } from "../../../squiggle-lang/src/public/SqValue/SqSpecification.js";
import { SquiggleErrorAlert } from "../index.js";
import { SqValueWithContext } from "../lib/utility.js";
import { widgetRegistry } from "./registry.js";

export type SpecificationStatus =
  | { type: "no-specification" }
  | { type: "load-error"; error: SqError }
  | { type: "validation-success" }
  | { type: "validation-failure"; error: string };

// Note that this can be slow to run, if ``validate`` is too slow.
export function getSpecificationStatus(
  value: SqValueWithContext
): SpecificationStatus {
  const specification = value.tags.specification();
  if (!specification) {
    return { type: "no-specification" };
  }
  const validateValue = specification!.validate(value);
  if (!validateValue.ok) {
    return { type: "load-error", error: validateValue.value };
  }
  const possibleErrorMessage =
    validateValue?.ok && validateValue.value.tag === "String"
      ? validateValue.value.value
      : undefined;
  if (possibleErrorMessage) {
    return { type: "validation-failure", error: possibleErrorMessage };
  } else {
    return { type: "validation-success" };
  }
}

export const specificationView = (
  specification: SqSpecification,
  specificationStatus?: SpecificationStatus
) => {
  const hasError =
    (specificationStatus &&
      specificationStatus.type === "validation-failure") ||
    specificationStatus?.type === "load-error";
  return (
    <div>
      <div className="flex space-x-1.5 items-center text-green-800 opacity-80 mb-3">
        <CubeTransparentIcon className="flex" size={16} />
        <span className="flex text-xs">Specification</span>
      </div>
      <div className="font-medium text-green-900 mb-1">
        {specification.title}
      </div>
      {specification.description && (
        <p className="text-sm text-gray-500">{specification.description}</p>
      )}
      {specificationStatus && (
        <>
          <div className="mt-5 mb-2">
            <div
              className={clsx(
                "rounded-sm px-2 py-0.5 inline-flex font-medium text-sm items-center space-x-2",
                hasError
                  ? "bg-red-100 text-red-900"
                  : "bg-green-100 text-green-900"
              )}
            >
              {hasError ? <XIcon size={12} /> : <CheckIcon size={16} />}
              <div>{hasError ? "Checks Failed" : "Checks Passed"}</div>
            </div>
          </div>
          {specificationStatus.type === "load-error" && (
            <div className="text-red-700 text-xs">
              <SquiggleErrorAlert error={specificationStatus.error} />
            </div>
          )}
          {specificationStatus.type === "validation-failure" && (
            <div className="text-red-700 text-xs">
              {specificationStatus.error}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export const specificationStatusPreview = (
  specificationStatus: SpecificationStatus
) => {
  const hasError =
    specificationStatus.type === "validation-failure" ||
    specificationStatus.type === "load-error";
  return (
    <div
      className={clsx(
        "rounded-sm cursor-pointer transition px-0.5 flex flex-row items-center space-x-1.5",
        hasError
          ? "bg-red-100 hover:bg-red-300"
          : "bg-green-100 hover:bg-green-300"
      )}
    >
      <CubeTransparentIcon
        size={16}
        className={clsx(
          "opacity-50",
          hasError ? "text-red-900" : "text-green-900"
        )}
      />
      {hasError ? (
        <XIcon size={12} className="text-red-800" />
      ) : (
        <CheckIcon size={16} className="text-green-800" />
      )}
    </div>
  );
};

widgetRegistry.register("Specification", {
  Preview: () => <CubeTransparentIcon className="text-green-700" size={14} />,
  Chart: (value) => (
    <div className="py-3 px-2">{specificationView(value.value)}</div>
  ),
});
