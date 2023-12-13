import { FC } from 'react';

import { SqValueWithContext } from '../../lib/utility.js';
import { widgetRegistry } from '../../widgets/registry.js';

export const valueToPreviewString = (value: SqValueWithContext) => {
  const widget = widgetRegistry.widgets.get(value.tag);
  return widget?.heading?.(value) || value.publicName();
};

export const SquiggleValueHeader: FC<{
  value: SqValueWithContext;
}> = ({ value }) => {
  const heading = valueToPreviewString(value);

  return (
    <div className="text-stone-400 group-hover:text-stone-600 text-sm transition">
      {heading}
    </div>
  );
};
