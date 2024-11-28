"use client";
import { clsx } from "clsx";
import { FC, useEffect, useState, useTransition } from "react";

import {
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  GlobeIcon,
  LockIcon,
  RefreshIcon,
} from "@quri/ui";

import { updateModelPrivacyAction } from "@/server/models/actions/updateModelPrivacyAction";
import { ModelCardDTO } from "@/server/models/data/card";

function getIconComponent(isPrivate: boolean) {
  return isPrivate ? LockIcon : GlobeIcon;
}

const UpdatePrivacyAction: FC<{
  model: ModelCardDTO;
  close: () => void;
}> = ({ model, close }) => {
  const [initialIsPrivate] = useState(model.isPrivate);
  const [isPending, startTransition] = useTransition();
  const act = () => {
    startTransition(async () => {
      await updateModelPrivacyAction({
        owner: model.owner.slug,
        slug: model.slug,
        isPrivate: !model.isPrivate,
      });
    });
  };

  // We can't just call `close()` in the transition; server action finishes before it sends back the revalidated UI.
  // This is an ugly workaround; see also: https://github.com/vercel/next.js/discussions/53206
  // Discussion in QURI Slack: https://quri.slack.com/archives/C059EEU0HMM/p1732810277978719
  useEffect(() => {
    if (model.isPrivate !== initialIsPrivate) {
      close();
    }
  }, [model.isPrivate, initialIsPrivate, close]);

  return (
    <DropdownMenuActionItem
      title={model.isPrivate ? "Make public" : "Make private"}
      icon={isPending ? RefreshIcon : getIconComponent(!model.isPrivate)}
      acting={isPending}
      onClick={act}
    />
  );
};

export const ModelAccessControls: FC<{
  model: ModelCardDTO;
  isEditable: boolean;
}> = ({ model, isEditable }) => {
  const { isPrivate } = model;

  const Icon = getIconComponent(isPrivate);

  const body = (
    // TODO: copy-pasted from CacheMenu from relative-values, extract to <InvisibleMaybeDropdown> or something
    <div
      className={clsx(
        "flex items-center rounded-sm px-2 py-1 text-sm text-gray-500",
        isEditable && "cursor-pointer hover:bg-slate-200"
      )}
    >
      <Icon className="mr-1 text-gray-500" size={14} />
      {isPrivate ? "Private" : "Public"}
    </div>
  );

  return isEditable ? (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdatePrivacyAction model={model} close={close} />
        </DropdownMenu>
      )}
    >
      {body}
    </Dropdown>
  ) : (
    body
  );
};
