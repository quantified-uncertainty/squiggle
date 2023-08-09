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

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

export const NewModel: FC = () => {
  const { data: session } = useSession({ required: true });

  const toast = useToast();

  const form = useForm<{
    slug: string | undefined;
  }>({
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
    },
    mode: "onChange",
  });

  const watchSlug = form.watch("slug");

  useEffect(() => {
    // watchSlug can be undefined if the page was just loaded
    if (watchSlug && watchSlug.includes(" ")) {
      const patchedSlug = watchSlug.replaceAll(" ", "-");
      form.setValue("slug", patchedSlug);
      form.trigger();
    }
  }, [watchSlug, form]);

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewModelMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    const slug = data.slug;
    if (!slug) {
      // shouldn't happen but satisfies Typescript
      toast("Slug is undefined", "error");
      return;
    }
    saveMutation({
      variables: {
        input: {
          code: defaultCode,
          slug,
        },
      },
      onCompleted(completion) {
        if (completion.result.__typename === "BaseError") {
          toast(completion.result.message, "error");
        } else {
          //My guess is that there are more elegant ways of returning the slug, but I wasn't sure what was the best way to do it
          const username = session?.user?.username;
          if (username) {
            router.push(modelRoute({ username, slug }));
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
        <Button
          onClick={save}
          disabled={!form.formState.isValid || isSaveInFlight}
          theme="primary"
        >
          Save
        </Button>
      </FormProvider>
    </form>
  );
};
