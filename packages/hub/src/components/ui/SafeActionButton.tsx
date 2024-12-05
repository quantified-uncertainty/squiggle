"use client";
import {
  InferSafeActionFnInput,
  InferSafeActionFnResult,
} from "next-safe-action";
import { HookSafeActionFn, useAction } from "next-safe-action/hooks";
import { ReactNode } from "react";

import { Button, useToast } from "@quri/ui";

export function SafeActionButton<
  const Action extends HookSafeActionFn<any, any, any, any, any, any>,
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
  action: Action;
  input: InferSafeActionFnInput<typeof action>["clientInput"];
  onSuccess?: (
    data: NonNullable<InferSafeActionFnResult<typeof action>["data"]>
  ) => void;
  title: string;
  confirmation?: string;
} & Pick<Parameters<typeof Button>[0], "theme" | "size">): ReactNode {
  const toast = useToast();

  const { execute, isPending } = useAction(action, {
    onSuccess: ({ data }) => {
      if (data) {
        if (confirmation) {
          toast(confirmation, "confirmation");
        }
        onSuccess?.(data);
      }
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
