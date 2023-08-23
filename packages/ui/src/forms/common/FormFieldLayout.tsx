import { clsx } from "clsx";
import { FC, PropsWithChildren } from "react";

export type FormFieldLayoutProps = {
  label?: string;
  // TODO - allow ReactNode for inline links and other formatting?
  description?: string;
  // useful for checkboxes
  inlineLabel?: boolean;
  // If set, label won't wrap children and won't be clickable. This is useful for some custom fields where outer label leads to too large clickable area.
  standaloneLabel?: boolean;
};

export const FieldLayout: FC<PropsWithChildren<FormFieldLayoutProps>> = ({
  label,
  description,
  inlineLabel,
  standaloneLabel,
  children,
}) => {
  const OuterTag = standaloneLabel ? "div" : "label";
  const InnerTag = standaloneLabel ? "label" : "div";

  // TODO - use <label forHtml=...> (but this would require a `useId`)
  return (
    <OuterTag className="block">
      <div
        className={clsx(
          inlineLabel && "flex flex-row-reverse items-end justify-end gap-2"
        )}
      >
        {label !== undefined && (
          <InnerTag
            className={clsx(
              "text-sm font-medium mb-1",
              // TODO - add `disabled` prop?
              "text-gray-900",
              inlineLabel && "leading-none"
            )}
          >
            {label}
          </InnerTag>
        )}
        {children}
      </div>
      {description !== undefined && (
        <div className="mt-1 text-sm text-slate-600">{description}</div>
      )}
    </OuterTag>
  );
};
