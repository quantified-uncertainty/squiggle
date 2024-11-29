import { FC, useEffect, useState, useTransition } from "react";

import { DropdownMenuActionItem, IconProps, useCloseDropdown } from "@quri/ui";

export const ServerActionDropdownAction: FC<{
  title: string;
  icon?: FC<IconProps>;
  act: () => Promise<void>;
  // If set, the dropdown will close only when the invariant changes.
  invariant?: unknown;
}> = ({ title, icon, act: originalAct, invariant }) => {
  const [initialInvariant] = useState(invariant);
  const close = useCloseDropdown();

  const [isPending, startTransition] = useTransition();
  const act = () => {
    startTransition(async () => {
      await originalAct();
      if (invariant === undefined) {
        close();
      }
    });
  };

  // We can't just call `close()` in the transition; server action finishes before it sends back the revalidated UI.
  // This is an ugly workaround; see also: https://github.com/vercel/next.js/discussions/53206
  // Discussion in QURI Slack: https://quri.slack.com/archives/C059EEU0HMM/p1732810277978719
  useEffect(() => {
    if (invariant !== initialInvariant) {
      close();
    }
  }, [invariant, initialInvariant, close]);

  return (
    <DropdownMenuActionItem
      title={title}
      icon={icon}
      acting={isPending}
      onClick={act}
    />
  );
};
