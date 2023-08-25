"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, TextFormField, useToast } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { modelRoute } from "@/routes";
import { useDashifyFormField } from "@/hooks/useDashifyFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";

const Mutation = graphql`
  mutation NewModelMutation($input: MutationCreateSquiggleSnippetModelInput!) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateSquiggleSnippetResult {
        model {
          id
          slug
        }
      }
    }
  }
`;

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

type FormShape = {
  slug: string | undefined;
};

export const NewModel: FC = () => {
  const { data: session } = useSession({ required: true });

  const form = useForm<FormShape>({
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
    },
    mode: "onChange",
  });

  useDashifyFormField(form, "slug");

  const router = useRouter();

  const [runMutation, inFlight] = useAsyncMutation<
    NewModelMutation,
    "CreateSquiggleSnippetResult"
  >({
    mutation: Mutation,
    expectedTypename: "CreateSquiggleSnippetResult",
    blockOnSuccess: true,
  });

  const save = form.handleSubmit(async (data) => {
    await runMutation({
      variables: {
        input: {
          slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
          code: defaultCode,
        },
      },
      onCompleted: (result) => {
        const username = session?.user?.username;
        if (username) {
          router.push(modelRoute({ username, slug: result.model.slug }));
        } else {
          router.push("/");
        }
      },
    });
  });

  return (
    <form onSubmit={save}>
      <FormProvider {...form}>
        <H1>New Model</H1>
        <div className="mb-4">
          <TextFormField
            name="slug"
            description="Must be alphanumerical, with no spaces. Example: my-long-model"
            label="Model Name"
            placeholder="my-model"
            rules={{
              pattern: {
                value: /^[\w-]+$/,
                message:
                  "Must be alphanumerical, with no spaces. Example: my-long-model",
              },
              required: true,
            }}
          />
        </div>
        <Button
          onClick={save}
          disabled={!form.formState.isValid || inFlight}
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
