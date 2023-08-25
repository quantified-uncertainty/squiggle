"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql, useFragment, usePreloadedQuery } from "react-relay";

import { EditRelativeValuesDefinitionMutation } from "@/__generated__/EditRelativeValuesDefinitionMutation.graphql";
import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";
import QueryNode, {
  RelativeValuesDefinitionPageQuery as QueryType,
} from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import {
  RelativeValuesDefinitionForm,
  RelativeValuesDefinitionFormShape,
} from "@/relative-values/components/RelativeValuesDefinitionForm";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "../RelativeValuesDefinitionPage";

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
  query: SerializablePreloadedQuery<typeof QueryNode, QueryType>;
}> = ({ query }) => {
  useSession({ required: true });

  const queryRef = useSerializablePreloadedQuery(query);
  const { relativeValuesDefinition: result } = usePreloadedQuery(
    RelativeValuesDefinitionPageQuery,
    queryRef
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

  const save = async (data: RelativeValuesDefinitionFormShape) => {
    await saveMutation({
      variables: {
        input: {
          slug: definition.slug,
          username: definition.owner.username,
          title: data.title,
          items: data.items,
          clusters: data.clusters,
          recommendedUnit: data.recommendedUnit,
        },
      },
      onCompleted() {
        // TODO - go to definition page instead?
        router.push("/");
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
