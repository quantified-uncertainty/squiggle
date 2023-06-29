import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { AdjustmentsVerticalIcon } from "@quri/ui";

import {
  PlaygroundSettings,
  PlaygroundSettingsForm,
  viewSettingsSchema,
} from "../../PlaygroundSettings.js";
import { MenuItem } from "./MenuItem.js";
import { OverrideHandle } from "./index.js";

// Passing settings as prop sacrifices react-hook-form performance optimizations, but that's not very important.
const GlobalSettingsForm: FC<{
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

export const SetttingsMenuItem: FC<{
  overrideHandle: OverrideHandle;
}> = ({ overrideHandle }) => {
  return (
    <MenuItem
      onClick={() => {
        overrideHandle.override({
          title: "Settings",
          render: ({ settings, setSettings }) => (
            <GlobalSettingsForm
              settings={settings}
              onSettingsChange={setSettings}
            />
          ),
        });
      }}
      icon={AdjustmentsVerticalIcon}
      tooltipText="Configuration"
    />
  );
};
