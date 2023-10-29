"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { NewDefinitionMutation } from "@/__generated__/NewDefinitionMutation.graphql";
import { H1 } from "@/components/ui/Headers";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { FormShape } from "@/relative-values/components/RelativeValuesDefinitionForm/FormShape";
import { relativeValuesRoute } from "@/routes";

const Mutation = graphql`
  mutation NewDefinitionMutation(
    $input: MutationCreateRelativeValuesDefinitionInput!
  ) {
    result: createRelativeValuesDefinition(input: $input) {
      __typename
      ... on ValidationError {
        message
      }
      ... on CreateRelativeValuesDefinitionResult {
        definition {
          id
          slug
          owner {
            slug
          }
        }
      }
    }
  }
`;

export const NewDefinition: FC = () => {
  useSession({ required: true });

  const router = useRouter();

  const [runMutation] = useAsyncMutation<NewDefinitionMutation>({
    mutation: Mutation,
    expectedTypename: "CreateRelativeValuesDefinitionResult",
    confirmation: "Definition created",
    blockOnSuccess: true,
  });

  const save = async (data: FormShape) => {
    await runMutation({
      variables: {
        input: {
          slug: data.slug,
          title: data.title,
          items: data.items,
          clusters: data.clusters,
          recommendedUnit: data.recommendedUnit,
        },
      },
      onCompleted: (result) => {
        if (result.__typename === "CreateRelativeValuesDefinitionResult") {
          router.push(
            relativeValuesRoute({
              owner: result.definition.owner.slug,
              slug: result.definition.slug,
            })
          );
        }
      },
    });
  };

  return (
    <div>
      <H1 size="normal">New Relative Values definition</H1>
      <RelativeValuesDefinitionForm save={save} />
    </div>
  );
};
