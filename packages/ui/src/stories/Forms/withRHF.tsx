import { ReactNode } from "react";
import {
  DeepPartial,
  FieldValues,
  UseFormRegister,
  useForm,
} from "react-hook-form";

type WrappedRender<
  Args extends Record<string, any>,
  Values extends FieldValues
> = (args: Args, register: UseFormRegister<Values>) => ReactNode;

function Form<Args extends Record<string, any>, Values extends FieldValues>({
  render,
  args,
  defaultValues,
}: {
  render: WrappedRender<Args, Values>;
  args: Args;
  defaultValues?: DeepPartial<Values>;
}) {
  const { register } = useForm<Values>({ defaultValues });
  return <form>{render(args, register)}</form>;
}

// This is kinda hacky (in practice, Typescript doesn't infer T well the way we use it now).
// Could be improved with better types and abstractions, but it's pretty complicated.
export function withRHF<
  Args extends Record<string, any>,
  Values extends FieldValues
>(
  render: WrappedRender<Args, Values>,
  // If you provide defaultValues, then Value generic will be inferred; that means that `register` function will be stricter typed.
  // As a consequence, since `name` field in `args` is represented as string, type check might fail.
  // Casting with `{...args as any}` seems fine, for now, since this is just for storybook purposes.
  defaultValues?: DeepPartial<Values>
) {
  // returns storybook's render function
  return (args: Args) => {
    return <Form render={render} args={args} defaultValues={defaultValues} />;
  };
}
