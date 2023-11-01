"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { EditRelativeValuesDefinitionMutation } from "@/__generated__/EditRelativeValuesDefinitionMutation.graphql";
import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import { RelativeValuesDefinitionPageQuery as QueryType } from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { RelativeValuesDefinitionForm } from "@/relative-values/components/RelativeValuesDefinitionForm";
import { FormShape } from "@/relative-values/components/RelativeValuesDefinitionForm/FormShape";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { SerializablePreloadedQuery } from "@/relay/loadPageQuery";
import { usePageQuery } from "@/relay/usePageQuery";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "../RelativeValuesDefinitionPage";
import { relativeValuesRoute } from "@/routes";

const Mutation = graphql`
  mutation EditRelativeValuesDefinitionMutation(
    $input: MutationUpdateRelativeValuesDefinitionInput!
  ) {
    result: updateRelativeValuesDefinition(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateRelativeValuesDefinitionResult {
        definition {
          id
        }
      }
    }
  }
`;

export const EditRelativeValuesDefinition: FC<{
  query: SerializablePreloadedQuery<QueryType>;
}> = ({ query }) => {
  useSession({ required: true });

  const [{ relativeValuesDefinition: result }] = usePageQuery(
    RelativeValuesDefinitionPageQuery,
    query
  );

  const definitionRef = extractFromGraphqlErrorUnion(
    result,
    "RelativeValuesDefinition"
  );

  const router = useRouter();

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    definitionRef
  );
  const revision = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    definition.currentRevision
  );

  const [saveMutation] = useAsyncMutation<EditRelativeValuesDefinitionMutation>(
    {
      mutation: Mutation,
      expectedTypename: "UpdateRelativeValuesDefinitionResult",
    }
  );

  const save = async (data: FormShape) => {
    await saveMutation({
      variables: {
        input: {
          slug: definition.slug,
          owner: definition.owner.slug,
          title: data.title,
          items: data.items,
          clusters: data.clusters,
          recommendedUnit: data.recommendedUnit,
        },
      },
      onCompleted() {
        router.push(
          relativeValuesRoute({
            owner: definition.owner.slug,
            slug: definition.slug,
          })
        );
      },
    });
  };

  return (
    <RelativeValuesDefinitionForm
      defaultValues={{
        slug: "", // unused but necessary for types
        title: revision.title,
        items: revision.items,
        clusters: revision.clusters,
        recommendedUnit: revision.recommendedUnit,
      }}
      withoutSlug
      save={save}
    />
  );
};
