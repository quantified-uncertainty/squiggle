"use client";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { FormProvider } from "react-hook-form";
import { graphql } from "relay-runtime";

import { generateSeed } from "@quri/squiggle-lang";
import { Button, CheckboxFormField } from "@quri/ui";
import { defaultSquiggleVersion } from "@quri/versioned-squiggle-components";

import { SelectGroup, SelectGroupOption } from "@/components/SelectGroup";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useMutationForm } from "@/hooks/useMutationForm";
import { modelRoute } from "@/routes";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";

const defaultCode = `/*
Describe your code here
*/

a = normal(2, 5)
`;

type FormShape = {
  slug: string | undefined;
  group: SelectGroupOption | null;
  isPrivate: boolean;
};

export const NewModel: FC<{ initialGroup: SelectGroupOption | null }> = ({
  initialGroup,
}) => {
  const [group] = useState(initialGroup);

  const router = useRouter();

  const { form, onSubmit, inFlight } = useMutationForm<
    FormShape,
    NewModelMutation,
    "CreateSquiggleSnippetModelResult"
  >({
    mode: "onChange",
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
      group,
      isPrivate: false,
    },
    mutation: graphql`
      mutation NewModelMutation(
        $input: MutationCreateSquiggleSnippetModelInput!
      ) {
        result: createSquiggleSnippetModel(input: $input) {
          __typename
          ... on BaseError {
            message
          }
          ... on CreateSquiggleSnippetModelResult {
            model {
              id
              slug
              owner {
                slug
              }
            }
          }
        }
      }
    `,
    expectedTypename: "CreateSquiggleSnippetModelResult",
    blockOnSuccess: true,
    formDataToVariables: (data) => ({
      input: {
        slug: data.slug ?? "", // shouldn't happen but satisfies Typescript
        groupSlug: data.group?.slug,
        isPrivate: data.isPrivate,
        code: defaultCode,
        version: defaultSquiggleVersion,
        seed: generateSeed(),
      },
    }),
    onCompleted: (result) => {
      router.push(
        modelRoute({
          owner: result.model.owner.slug,
          slug: result.model.slug,
        })
      );
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <FormProvider {...form}>
        <H1>New Model</H1>
        <div className="mb-4 mt-4 space-y-4">
          <SlugFormField<FormShape>
            name="slug"
            example="my-long-model"
            label="Model Name"
            placeholder="my-model"
          />
          <SelectGroup<FormShape>
            label="Group"
            description="Optional. Models owned by a group are editable by all members of the group."
            name="group"
            required={false}
            myOnly={true}
          />
          <CheckboxFormField<FormShape> label="Private" name="isPrivate" />
        </div>
        <Button
          onClick={onSubmit}
          disabled={!form.formState.isValid || inFlight}
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
