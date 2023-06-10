import { flip, offset, shift, useFloating } from "@floating-ui/react";
import { PropsWithChildren, ReactNode } from "react";
import {
  FieldPath,
  FieldValues,
  RegisterOptions,
  UseFormRegisterReturn,
  useFormContext,
} from "react-hook-form";

import { ErrorIcon } from "../../icons/ErrorIcon.js";

type WithRHFErrorProps<T extends FieldValues> = {
  name: FieldPath<T>;
};

export function WithRHFError<T extends FieldValues>({
  name,
  children,
}: PropsWithChildren<WithRHFErrorProps<T>>) {
  const { getFieldState, formState, clearErrors } = useFormContext<T>();

  const { error } = getFieldState(name, formState);
  const isErrorOpen = Boolean(error);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start", // TODO - make configurable
    open: isErrorOpen,
    middleware: [shift(), offset(2), flip()],
  });

  return (
    <div>
      <div ref={refs.setReference}>{children}</div>
      {isErrorOpen && (
        <div
          ref={refs.setFloating}
          style={floatingStyles}
          onClick={() => clearErrors(name)}
        >
          <div className="bg-red-100 px-2 py-1 rounded flex gap-1 items-center">
            <ErrorIcon size={16} className="text-red-500" />
            <div className="text-sm text-red-800 font-medium">
              {error?.message || error?.type || String(error)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type Props<T extends FieldValues> = {
  name: FieldPath<T>;
  rules?: RegisterOptions<T>;
  children: (props: UseFormRegisterReturn<FieldPath<T>>) => ReactNode;
};

// Helper component for various react-hook-form connected components.
export function FormInput<T extends FieldValues>({
  name,
  rules,
  children,
}: Props<T>) {
  const { register } = useFormContext<T>();

  return (
    <WithRHFError name={name}>{children(register(name, rules))}</WithRHFError>
  );
}

/* Usage example:
 *
 * <FormInput name="foo">
 *   {(props) => <StyledInput type="text" {...props} />}
 * </FormInput>
 */
