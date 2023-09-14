"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button, useToast } from "@quri/ui";

import { NewGroupMutation } from "@/__generated__/NewGroupMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { groupRoute } from "@/routes";

const Mutation = graphql`
  mutation NewGroupMutation($input: MutationCreateGroupInput!) {
    result: createGroup(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateGroupResult {
        group {
          id
          slug
        }
      }
    }
  }
`;

export const NewGroup: FC = () => {
  useSession({ required: true });

  const toast = useToast();

  type FormShape = {
    slug: string | undefined;
  };

  const form = useForm<FormShape>({
    defaultValues: {},
    mode: "onChange",
  });

  const router = useRouter();

  const [saveMutation, isSaveInFlight] = useAsyncMutation<NewGroupMutation>({
    mutation: Mutation,
    expectedTypename: "CreateGroupResult",
    blockOnSuccess: true,
  });

  const save = form.handleSubmit(async (data) => {
    const slug = data.slug;
    if (!slug) {
      // shouldn't happen but satisfies Typescript
      toast("Slug is undefined", "error");
      return;
    }
    await saveMutation({
      variables: {
        input: { slug },
      },
      onCompleted() {
        router.push(groupRoute({ slug }));
      },
    });
  });

  return (
    <form onSubmit={save}>
      <FormProvider {...form}>
        <H1>New Group</H1>
        <div className="mb-4">
          <SlugFormField<FormShape>
            name="slug"
            example="abc-project"
            label="Group Name"
            placeholder="my-group"
          />
        </div>
        <Button
          onClick={save}
          disabled={!form.formState.isValid || isSaveInFlight}
          theme="primary"
        >
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
