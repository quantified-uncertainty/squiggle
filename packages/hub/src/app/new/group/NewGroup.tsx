"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { Button, TextFormField, useToast } from "@quri/ui";

import { NewGroupMutation } from "@/__generated__/NewGroupMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { useDashifyFormField } from "@/hooks/useDashifyFormField";

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
  const { data: session } = useSession({ required: true });

  const toast = useToast();

  const form = useForm<{
    slug: string | undefined;
  }>({
    defaultValues: {},
    mode: "onChange",
  });

  useDashifyFormField(form, "slug");

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewGroupMutation>(Mutation);

  const save = form.handleSubmit((data) => {
    const slug = data.slug;
    if (!slug) {
      // shouldn't happen but satisfies Typescript
      toast("Slug is undefined", "error");
      return;
    }
    saveMutation({
      variables: {
        input: { slug },
      },
      onCompleted(completion) {
        if (completion.result.__typename === "BaseError") {
          toast(completion.result.message, "error");
        } else {
          router.push(groupRoute({ slug }));
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
        <H1>New Group</H1>
        <div className="mb-4">
          <TextFormField
            name="slug"
            description="Must be alphanumerical, with no spaces. Example: abc-project"
            label="Group Name"
            placeholder="my-group"
            rules={{
              pattern: {
                value: /^[\w-]+$/,
                message:
                  "Must be alphanumerical, with no spaces. Example: abc-project",
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
          Create
        </Button>
      </FormProvider>
    </form>
  );
};
