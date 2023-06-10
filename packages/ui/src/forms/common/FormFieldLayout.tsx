import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

export type FormFieldLayoutProps = {
  label?: string; // TODO - `inlineLabel` prop for checkboxes and color inputs
  description?: string; // TODO - allow ReactNode for inline links and other formatting?
  inlineLabel?: boolean; // useful for checkboxes
};

export const FieldLayout: FC<PropsWithChildren<FormFieldLayoutProps>> = ({
  label,
  inlineLabel,
  description,
  children,
}) => {
  // TODO - use <label forHtml=...> (but this would require a `useId`)
  return (
    <label>
      <div
        className={clsx(
          inlineLabel && "flex flex-row-reverse items-end justify-end gap-2"
        )}
      >
        {label !== undefined && (
          <div
            className={clsx(
              "text-sm font-medium mb-1",
              // TODO - add `disabled` prop?
              "text-gray-600",
              inlineLabel && "leading-none"
            )}
          >
            {label}
          </div>
        )}
        {children}
      </div>
      {description !== undefined && (
        <div className="mt-1 text-sm text-slate-600">{description}</div>
      )}
    </label>
  );
};
