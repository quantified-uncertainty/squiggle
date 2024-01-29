import merge from "lodash/merge.js";
import { useCallback, useState } from "react";

import {
  defaultPlaygroundSettings,
  PartialPlaygroundSettings,
  type PlaygroundSettings,
} from "../../components/PlaygroundSettings.js";

export type Args = {
  defaultSettings: PartialPlaygroundSettings;
  onSettingsChange?: ((settings: PlaygroundSettings) => void) | undefined;
};

export function usePlaygroundSettings({
  defaultSettings,
  onSettingsChange,
}: Args) {
  const [settings, setSettings] = useState(
    () =>
      merge(
        {},
        defaultPlaygroundSettings,
        Object.fromEntries(
          Object.entries(defaultSettings).filter(([, v]) => v !== undefined)
        )
      ) as PlaygroundSettings
  );

  const handleSettingsChange = useCallback(
    (newSettings: PlaygroundSettings) => {
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    },
    [onSettingsChange]
  );

  const randomizeSeed = () => {
    setSettings({
      ...settings,
      environment: {
        ...settings.environment,
        seed: String(Math.random() * 100000),
      },
    });
  };

  return { settings, setSettings: handleSettingsChange, randomizeSeed };
}
