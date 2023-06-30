import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import {
  PlaygroundSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../../PlaygroundSettings.js";

// Passing settings as prop sacrifices react-hook-form performance optimizations, but that's not very important.
export const GlobalSettingsModal: FC<{
  settings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
}> = ({ settings, onSettingsChange }) => {
  const form = useForm({
    resolver: zodResolver(viewSettingsSchema),
    defaultValues: settings,
    mode: "onChange",
  });

  useEffect(() => {
    const submit = form.handleSubmit(onSettingsChange);
    const subscription = form.watch(() => submit());
    return () => subscription.unsubscribe();
  }, [form, onSettingsChange]);

  return (
    <FormProvider {...form}>
      <PlaygroundSettingsForm />
    </FormProvider>
  );
};
