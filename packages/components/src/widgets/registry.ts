import { FC, ReactNode } from "react";

import { SqBoxedValue, SqValue } from "@quri/squiggle-lang";

import { PlaygroundSettings } from "../components/PlaygroundSettings.js";
import { SqValueWithContext } from "../lib/utility.js";

type SqValueTag = SqValue["tag"];

type ValueByTag<T extends SqValueTag> = Extract<SqValueWithContext, { tag: T }>;

type Widget<T extends SqValueTag = SqValueTag> = {
  Chart: FC<{
    value: Extract<SqValueWithContext, { tag: T }>;
    settings: PlaygroundSettings;
    boxed?: SqBoxedValue;
  }>;
  Preview?: FC<{ value: ValueByTag<T>; boxed?: SqBoxedValue }>;
  Menu?: FC<{
    value: ValueByTag<T>;
  }>;
  heading?: (value: ValueByTag<T>) => string;
};

type WidgetConfig<T extends SqValueTag = SqValueTag> = {
  Chart(
    value: Extract<SqValueWithContext, { tag: T }>,
    settings: PlaygroundSettings,
    boxed?: SqBoxedValue
  ): ReactNode;
  Preview?: (value: ValueByTag<T>, boxed?: SqBoxedValue) => ReactNode;
  Menu?: (value: ValueByTag<T>, boxed?: SqBoxedValue) => ReactNode;
  heading?: (value: ValueByTag<T>, boxed?: SqBoxedValue) => string;
};

class WidgetRegistry {
  widgets: Map<SqValueTag, Widget> = new Map();

  register<T extends SqValueTag>(tag: T, config: WidgetConfig<T>) {
    // We erase widget subtype because it'd be hard to maintain dynamically, but rely on map key/value types being matched.
    // It's not perfect but type-unsafe parts are contained in a few helper components such as `SquiggleValueChart`.

    const widget: Widget = {
      Chart: ({ value, settings, boxed }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return config.Chart(value as ValueByTag<T>, settings, boxed);
      },
    };
    widget.Chart.displayName = `${tag}Chart`;

    const { Preview, Menu, heading } = config;

    if (Preview) {
      widget.Preview = ({ value, boxed }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return Preview(value as ValueByTag<T>, boxed);
      };
      widget.Preview.displayName = `${tag}Preview`;
    }

    if (Menu) {
      widget.Menu = ({ value }) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return Menu(value as ValueByTag<T>);
      };
      widget.Menu.displayName = `${tag}Menu`;
    }

    if (heading) {
      widget.heading = (value) => {
        if (value.tag !== tag) {
          throw new Error(`${tag} widget used incorrectly`);
        }
        return heading(value as ValueByTag<T>);
      };
    }

    this.widgets.set(tag, widget);
  }
}

export const widgetRegistry = new WidgetRegistry();
