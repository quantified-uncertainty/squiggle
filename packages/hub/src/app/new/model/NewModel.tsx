"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button, CheckboxFormField, ControlledFormField } from "@quri/ui";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { SelectGroup, SelectGroupOption } from "@/components/SelectGroup";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { modelRoute } from "@/routes";
import { PlaygroundVersionPicker } from "@/squiggle/components/PlaygroundVersionPicker";
import { SquiggleVersion, defaultSquiggleVersion } from "@/squiggle/versions";

const Mutation = graphql`
  mutation NewModelMutation($input: MutationCreateSquiggleSnippetModelInput!) {
    result: createSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateSquiggleSnippetModelResult {
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
  version: SquiggleVersion;
  group: SelectGroupOption | null;
  isPrivate: boolean;
};

export const NewModel: FC = () => {
  const { data: session } = useSession({ required: true });

  const form = useForm<FormShape>({
    defaultValues: {
      version: defaultSquiggleVersion,
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
      group: null,
      isPrivate: false,
    },
    mode: "onChange",
  });

  const router = useRouter();

  const [runMutation, inFlight] = useAsyncMutation<
    NewModelMutation,
    "CreateSquiggleSnippetModelResult"
  >({
    mutation: Mutation,
    expectedTypename: "CreateSquiggleSnippetModelResult",
    blockOnSuccess: true,
  });

  const save = form.handleSubmit(async (data) => {
    await runMutation({
      variables: {
        input: {
          slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
          groupSlug: data.group?.slug,
          isPrivate: data.isPrivate,
          code: defaultCode,
          version: data.version,
        },
      },
      onCompleted: (result) => {
        const username = session?.user?.username;
        if (username) {
          router.push(
            modelRoute({
              owner: data.group?.slug ?? username,
              slug: result.model.slug,
            })
          );
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
        <div className="mb-4 space-y-4">
          <SlugFormField<FormShape>
            name="slug"
            example="my-long-model"
            label="Model Name"
            placeholder="my-model"
          />
          <SelectGroup<FormShape>
            label="Group"
            name="group"
            required={false}
            myOnly={true}
          />
          <CheckboxFormField<FormShape> label="Private" name="isPrivate" />
          <ControlledFormField<FormShape, SquiggleVersion>
            name="version"
            label="Squiggle version"
          >
            {({ onChange, value }) => (
              <div className="flex">
                <PlaygroundVersionPicker version={value} onChange={onChange} />
              </div>
            )}
          </ControlledFormField>
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
