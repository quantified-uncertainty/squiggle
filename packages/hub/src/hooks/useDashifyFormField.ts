import { useEffect } from "react";
import { FieldPathByValue, FieldValues, UseFormReturn } from "react-hook-form";

// Types here are a bit messy but should be safe for those who call this hook.
export function useDashifyFormField<
  TValues extends FieldValues,
  TName extends FieldPathByValue<
    TValues,
    string | undefined
  > = FieldPathByValue<TValues, string | undefined>
>(form: UseFormReturn<TValues, unknown>, field: TName) {
  const value = form.watch(field);

  useEffect(() => {
    if (typeof value === "string" && value.includes(" ")) {
      const patchedValue = String(value).replaceAll(" ", "-");
      // TName definition should make this safe
      form.setValue(field, patchedValue as any);
      form.trigger();
    }
  }, [value, form, field]);
}
