import { ReactNode, useActionState } from "react";

import { Button } from "@quri/ui";

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
}: {
  action: () => Promise<any>;
  title: string;
} & Pick<Parameters<typeof Button>[0], "theme" | "size">): ReactNode {
  const [, formAction, isPending] = useActionState(async () => {
    await action();
  }, undefined);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={isPending} theme={theme} size={size}>
        {title}
      </Button>
    </form>
  );
}
