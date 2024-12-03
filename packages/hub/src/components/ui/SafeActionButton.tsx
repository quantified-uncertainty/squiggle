"use client";
import { InferSafeActionFnInput } from "next-safe-action";
import { HookSafeActionFn, useAction } from "next-safe-action/hooks";
import { ReactNode } from "react";

import { Button, useToast } from "@quri/ui";

export function SafeActionButton<
  const T extends HookSafeActionFn<any, any, any, any, any, any>,
>({
  action,
  input,
  title,
  confirmation,
  onSuccess,
  // button props
  theme,
  size,
}: {
  action: T;
  input: InferSafeActionFnInput<typeof action>["clientInput"];
  onSuccess?: () => void;
  title: string;
  confirmation?: string;
} & Pick<Parameters<typeof Button>[0], "theme" | "size">): ReactNode {
  const toast = useToast();

  const { execute, isPending } = useAction(action, {
    onSuccess: ({ data }) => {
      if (data && confirmation) {
        toast(confirmation, "confirmation");
      }
      onSuccess?.();
    },
    onError: ({ error }) => {
      toast(
        error.serverError ? String(error.serverError) : "Internal error",
        "error"
      );
    },
  });

  return (
    <form action={() => execute(input)}>
      <Button type="submit" disabled={isPending} theme={theme} size={size}>
        {title}
      </Button>
    </form>
  );
}
