"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button } from "@quri/ui";

import { NewGroupMutation } from "@/__generated__/NewGroupMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useMutationForm } from "@/hooks/useMutationForm";
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

  const router = useRouter();

  type FormShape = {
    slug: string | undefined;
  };

  const { form, onSubmit, inFlight } = useMutationForm<
    FormShape,
    NewGroupMutation,
    "CreateGroupResult"
  >({
    defaultValues: {},
    mode: "onChange",
    mutation: Mutation,
    expectedTypename: "CreateGroupResult",
    blockOnSuccess: true,
    formDataToVariables: (data) => ({
      input: {
        slug: data.slug ?? "", // shouldn't happen, but satisfies TypeScript
      },
    }),
    onCompleted(result) {
      router.push(groupRoute({ slug: result.group.slug }));
    },
  });

  return (
    <form onSubmit={() => onSubmit()}>
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
