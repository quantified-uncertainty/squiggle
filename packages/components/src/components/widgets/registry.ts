import { ReactNode } from "react";

import { SqValue } from "@quri/squiggle-lang";

import { SqValueWithContext } from "../../lib/utility.js";
import { PlaygroundSettings } from "../PlaygroundSettings.js";
import { SettingsMenuParams } from "../SquiggleViewer/ValueWithContextViewer.js";

type SqValueTag = SqValue["tag"];

type ValueByTag<T extends SqValueTag> = Extract<SqValueWithContext, { tag: T }>;

type Widget<T extends SqValueTag = SqValueTag> = {
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

  register<T extends SqValueTag>(tag: T, widget: Widget<T>) {
    // We erase widget subtype because it'd be hard to maintain dynamically, but rely on map key/value types being matched.
    // It's not perfect but type-unsafe parts are contained in a few helper components such as `SquiggleValueChart`.
    this.widgets.set(tag, widget as unknown as Widget);
  }
}

export const widgetRegistry = new WidgetRegistry();
