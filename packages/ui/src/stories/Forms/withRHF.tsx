import { ComponentType, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "../../index.js";

// correct type signature here causes TS2742 "Not portable" error.
export const formDecorator /* NonNullable<Meta<unknown>["decorators"]>[number] */ =
  (Story: ComponentType) => {
    const form = useForm({
      mode: "onChange",
    });
    const [result, setResult] = useState<unknown>();

    return (
      <form onSubmit={form.handleSubmit(setResult)}>
        <FormProvider {...form}>
          <Story />
          <div className="mt-4">
            <Button type="submit" disabled={!form.formState.isValid}>
              Submit
            </Button>
          </div>
          {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : undefined}
        </FormProvider>
      </form>
    );
  };
