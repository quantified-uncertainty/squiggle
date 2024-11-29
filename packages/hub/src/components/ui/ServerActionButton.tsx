"use client";
import { ReactNode, useActionState } from "react";

import { Button, useToast } from "@quri/ui";

/*
 * Props for this component include:
 * - some props that are passed to `<Button>`
 * - `action` - the server action to run
 */
export function ServerActionButton({
  action,
  title,
  // button props
  theme,
  size,
  confirmation,
}: {
  action: () => Promise<any>;
  title: string;
  confirmation?: string;
} & Pick<Parameters<typeof Button>[0], "theme" | "size">): ReactNode {
  const toast = useToast();
  // TODO - pending based on invariant, similar to ServerActionDropdownAction
  const [, formAction, isPending] = useActionState(async () => {
    await action();
    if (confirmation) {
      toast(confirmation, "confirmation");
    }
  }, undefined);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending} theme={theme} size={size}>
        {title}
      </Button>
    </form>
  );
}
