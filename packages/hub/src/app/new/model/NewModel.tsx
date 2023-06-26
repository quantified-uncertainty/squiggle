"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";
import { modelRoute } from "@/routes";
import { H1 } from "@/components/ui/Headers";

import { Button, TextFormField, useToast } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";

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
        }
      }
    }
  }
`;

export const NewModel: FC = () => {
  const { data: session } = useSession({ required: true });

  const toast = useToast();

  const form = useForm<{
    code: string;
    slug: string;
  }>({
    defaultValues: {
      code: `/*
Describe your code here
*/

a = normal(2, 5)`,
    },
  });

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewModelMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    saveMutation({
      variables: {
        input: {
          code: data.code,
          slug: data.slug,
        },
      },
      onCompleted(completion) {
        if (completion.result.__typename === "BaseError") {
          toast(completion.result.message, "error");
        } else {
          //My guess is that there are more elegant ways of returning the slug, but I wasn't sure what was the best way to do it
          const username = session?.user?.username;
          if (username) {
            router.push(modelRoute({ username, slug: data.slug }));
          } else {
            router.push("/");
          }
        }
      },
      onError(e) {
        toast(e.toString(), "error");
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
        <Button onClick={save} disabled={isSaveInFlight} theme="primary">
          Save
        </Button>
      </FormProvider>
    </form>
  );
};
