import { flip, offset, shift, useFloating } from "@floating-ui/react";
import { PropsWithChildren, useRef } from "react";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";

import { ErrorIcon } from "../../icons/ErrorIcon.js";

type Props<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
> = {
  name: TName;
};

export function WithRHFError<
  TValues extends FieldValues,
  TName extends FieldPath<TValues> = FieldPath<TValues>
>({ name, children }: PropsWithChildren<Props<TValues, TName>>) {
  const { getFieldState, formState, clearErrors } = useFormContext<TValues>();

  const { error } = getFieldState(name, formState);
  const isErrorOpen = Boolean(error);

  const { refs, floatingStyles } = useFloating({
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
          style={floatingStyles}
          onClick={() => clearErrors(name)}
        >
          <div className="bg-red-100 fill-red-100 px-4 py-2 rounded flex gap-1 items-center shadow-md">
            <div className="rotate-45 w-2 h-2 absolute left-3 -top-1 bg-red-100 -z-10" />
            <ErrorIcon size={16} className="text-red-500" />
            <div className="text-sm text-red-800 font-medium leading-none">
              {error?.message || error?.type || String(error)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
