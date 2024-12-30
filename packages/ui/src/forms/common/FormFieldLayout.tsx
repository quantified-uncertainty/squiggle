import { clsx } from "clsx";
import { FC, PropsWithChildren, ReactElement } from "react";

import { TextTooltip } from "../../components/TextTooltip.js";

export type FormFieldLayoutProps = {
  label?: string;
  // TODO - allow ReactNode for inline links and other formatting?
  description?: string;
  layout?: "col" | "row" | "reverse-row";
  // If set, label won't wrap children and won't be clickable. This is useful for some custom fields where outer label leads to too large clickable area.
  standaloneLabel?: boolean;
  tooltip?: string;
};

export const FieldLayout: FC<PropsWithChildren<FormFieldLayoutProps>> = ({
  label,
  description,
  standaloneLabel,
  layout = "col",
  tooltip,
  children,
}) => {
  const OuterTag = standaloneLabel ? "div" : "label";
  const InnerTag = standaloneLabel ? "label" : "div";

  let labelEl: ReactElement<Record<string, unknown>> | null = null;
  if (label) {
    labelEl = (
      <InnerTag
        className={clsx(
          "mb-1 text-sm font-medium",
          // TODO - add `disabled` prop?
          "text-gray-900",
          layout !== "col" && "leading-none",
          tooltip && "cursor-help underline decoration-dotted"
        )}
      >
        {label}
      </InnerTag>
    );
  }
  if (labelEl && tooltip) {
    labelEl = (
      <TextTooltip text={tooltip} placement="bottom">
        {labelEl}
      </TextTooltip>
    );
  }

  // TODO - use <label forHtml=...> (but this would require a `useId`)
  return (
    <OuterTag className="block">
      {layout === "col" && (
        <div>
          {labelEl}
          {children}
        </div>
      )}
      {layout === "reverse-row" && (
        <div className="flex flex-row-reverse items-end justify-end gap-2">
          <div>{labelEl}</div>
          <div>{children}</div>
        </div>
      )}
      {layout === "row" && (
        <div className="flex items-center justify-between gap-2">
          <div>{labelEl}</div>
          <div>{children}</div>
        </div>
      )}

      {description && (
        <div className="mt-1 text-sm text-slate-600">{description}</div>
      )}
    </OuterTag>
  );
};
