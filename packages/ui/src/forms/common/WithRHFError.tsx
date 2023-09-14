"use client";
import { flip, offset, shift, useFloating } from "@floating-ui/react";
import { clsx } from "clsx";
import { PropsWithChildren } from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

import { ErrorIcon } from "../../icons/ErrorIcon.js";

type Props<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
> = {
  name: TName;
};

export function WithRHFError<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>,
>({ name, children }: PropsWithChildren<Props<TValues, TName>>) {
  const { getFieldState, formState, clearErrors } = useFormContext<TValues>();

  const { error } = getFieldState(name, formState);
  const isErrorOpen = Boolean(error);

  const { refs, floatingStyles, placement } = useFloating({
    placement: "bottom-start", // TODO - make configurable
    open: isErrorOpen,
    middleware: [shift(), offset(2), flip()],
  });

  return (
    <div className="relative">
      <div ref={refs.setReference}>{children}</div>
      {isErrorOpen && (
        <div
          ref={refs.setFloating}
          className="z-10"
          style={floatingStyles}
          onClick={() => clearErrors(name)}
        >
          <div className="bg-red-700 fill-red-700 pr-4 pl-3 py-2 rounded flex gap-1 items-center shadow-md">
            <div
              className={clsx(
                "rotate-45 w-2 h-2 absolute left-3 bg-red-700",
                placement === "top-start" ? "-bottom-1" : "-top-1"
              )}
            />
            <ErrorIcon size={16} className="text-white shrink-0" />
            <div className="text-sm text-white font-medium leading-none">
              {error?.message || error?.type || String(error)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
