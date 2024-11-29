import { FC, useTransition } from "react";

import { DropdownMenuActionItem, IconProps, useCloseDropdown } from "@quri/ui";

import { useCloseDropdownOnInvariantChange } from "./CloseDropdownOnInvariantChange";

export const ServerActionDropdownAction: FC<{
  title: string;
  icon?: FC<IconProps>;
  act: () => Promise<void>;
  // If set, the dropdown will close only after the invariant changes.
  // This is useful, because server action returns before it sends back the revalidated UI.
  // Re-rendering the new UI might take a while (it's async), so we don't want to close the dropdown immediately.
  // This is an ugly workaround; see also: https://github.com/vercel/next.js/discussions/53206
  // Discussion in QURI Slack: https://quri.slack.com/archives/C059EEU0HMM/p1732810277978719
  //
  // Also note that in some cases even `invariant` is not enough. Consider the scenario where the list of items in the dropdown is based on the component props.
  // In this case, this action would be unmounted before it would get the chance to close the dropdown.
  // In that scenario you might prefer to use `<CloseDropdownOnInvariantChange />` instead.
  // (The example of this is `<CacheMenu />`.)
  invariant?: unknown;
}> = ({ title, icon, act: originalAct, invariant }) => {
  const close = useCloseDropdown();

  const [isPending, startTransition] = useTransition();
  const act = () => {
    startTransition(async () => {
      await originalAct();

      // if there's no invariant, close the dropdown immediately
      if (invariant === undefined) {
        close();
      }
    });
  };

  useCloseDropdownOnInvariantChange(invariant);

  return (
    <DropdownMenuActionItem
      title={title}
      icon={icon}
      acting={isPending}
      onClick={act}
    />
  );
};
