"use client";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FC, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { graphql } from "relay-runtime";

import { Button, CheckboxFormField } from "@quri/ui";
import { defaultSquiggleVersion } from "@quri/versioned-playground";

import { NewModelMutation } from "@/__generated__/NewModelMutation.graphql";
import { NewModelPageQuery } from "@/__generated__/NewModelPageQuery.graphql";
import { SelectGroup, SelectGroupOption } from "@/components/SelectGroup";
import { H1 } from "@/components/ui/Headers";
import { SlugFormField } from "@/components/ui/SlugFormField";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import { modelRoute, newModelRoute } from "@/routes";
import { useLazyLoadQuery } from "react-relay";

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
  group: SelectGroupOption | null;
  isPrivate: boolean;
};

export const NewModel: FC = () => {
  const searchParams = useSearchParams();

  const { group: initialGroup } = useLazyLoadQuery<NewModelPageQuery>(
    graphql`
      query NewModelPageQuery($groupSlug: String!, $groupSlugIsSet: Boolean!) {
        group(slug: $groupSlug) @include(if: $groupSlugIsSet) {
          ... on Group {
            id
            slug
            myMembership {
              id
            }
          }
        }
      }
    `,
    {
      groupSlug: searchParams.get("group") ?? "",
      groupSlugIsSet: Boolean(searchParams.get("group")),
    }
  );

  const router = useRouter();
  useEffect(() => {
    router.replace(newModelRoute()); // clean up group=... param
  }, [router]);

  const { data: session } = useSession({ required: true });

  const form = useForm<FormShape>({
    defaultValues: {
      // don't pass `slug: ""` here, it will lead to form reset if a user started to type in a value before JS finished loading
      group: initialGroup?.myMembership ? initialGroup : null,
      isPrivate: false,
    },
    mode: "onChange",
  });

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
          version: defaultSquiggleVersion,
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
        <div className="space-y-4 mb-4 mt-4">
          <SlugFormField<FormShape>
            name="slug"
            example="my-long-model"
            label="Model Name"
            placeholder="my-model"
          />
          <SelectGroup<FormShape>
            description="Optional. Models owned by a group are editable by all members of the group."
            label="Group"
            name="group"
            required={false}
            myOnly={true}
          />
          <CheckboxFormField<FormShape> label="Private" name="isPrivate" />
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
