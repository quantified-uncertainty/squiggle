import { FC, ReactNode } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { SqValueWithContext } from "../lib/utility.js";
import { PlaygroundSettings } from "../components/PlaygroundSettings.js";
import { SettingsMenuParams } from "../components/SquiggleViewer/ValueWithContextViewer.js";

type SqValueTag = SqValue["tag"];

type ValueByTag<T extends SqValueTag> = Extract<SqValueWithContext, { tag: T }>;

type Widget<T extends SqValueTag = SqValueTag> = {
  Chart: FC<{
    value: Extract<SqValueWithContext, { tag: T }>;
    settings: PlaygroundSettings;
  }>;
  Preview?: FC<{ value: ValueByTag<T> }>;
  Menu?: FC<{
    value: ValueByTag<T>;
    params: SettingsMenuParams;
  }>;
  heading?: (value: ValueByTag<T>) => string;
};

type WidgetConfig<T extends SqValueTag = SqValueTag> = {
  render(
    value: Extract<SqValueWithContext, { tag: T }>,
    settings: PlaygroundSettings
  ): ReactNode;
  heading?: (value: ValueByTag<T>) => string;
  renderPreview?: (value: ValueByTag<T>) => ReactNode;
  renderSettingsMenu?: (
    value: ValueByTag<T>,
    params: SettingsMenuParams
  ) => ReactNode;
};

class WidgetRegistry {
  widgets: Map<SqValueTag, Widget> = new Map();

  register<T extends SqValueTag>(tag: T, config: WidgetConfig<T>) {
    // We erase widget subtype because it'd be hard to maintain dynamically, but rely on map key/value types being matched.
    // It's not perfect but type-unsafe parts are contained in a few helper components such as `SquiggleValueChart`.

    const { render, renderPreview, renderSettingsMenu } = config;

    const Chart: Widget["Chart"] = ({ value, settings }) => {
      if (value.tag !== tag) {
        throw new Error(`${tag} widget used incorrectly`);
      }
      return render(value as ValueByTag<T>, settings);
    };
    Chart.displayName = `${tag}Chart`;

    const widget: Widget = { Chart };

    if (renderPreview) {
      widget.Preview = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return renderPreview(value as ValueByTag<T>);
      };
      widget.Preview.displayName = `${tag}Preview`;
    }

    if (renderSettingsMenu) {
      widget.Menu = ({ value, params }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return renderSettingsMenu(value as ValueByTag<T>, params);
      };
      widget.Menu.displayName = `${tag}Menu`;
    }

    this.widgets.set(tag, widget);
  }
}

export const widgetRegistry = new WidgetRegistry();
