"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import {
  graphql,
  useFragment,
  useMutation,
  usePreloadedQuery,
} from "react-relay";

import { useToast } from "@quri/ui";

import {
  RelativeValuesDefinitionForm,
  RelativeValuesDefinitionFormShape,
} from "@/relative-values/components/RelativeValuesDefinitionForm";
import { RelativeValuesDefinitionRevisionFragment } from "@/relative-values/components/RelativeValuesDefinitionRevision";
import {
  RelativeValuesDefinitionPageFragment,
  RelativeValuesDefinitionPageQuery,
} from "../RelativeValuesDefinitionPage";

import { EditRelativeValuesDefinitionMutation } from "@/__generated__/EditRelativeValuesDefinitionMutation.graphql";
import QueryNode, {
  RelativeValuesDefinitionPageQuery as QueryType,
} from "@/__generated__/RelativeValuesDefinitionPageQuery.graphql";
import { RelativeValuesDefinitionRevision$key } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";
import { extractFromGraphqlErrorUnion } from "@/lib/graphqlHelpers";
import { SerializablePreloadedQuery } from "@/relay/loadSerializableQuery";
import { useSerializablePreloadedQuery } from "@/relay/useSerializablePreloadedQuery";
import { RelativeValuesDefinitionPage$key } from "@/__generated__/RelativeValuesDefinitionPage.graphql";

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

  const toast = useToast();

  const router = useRouter();

  const definition = useFragment<RelativeValuesDefinitionPage$key>(
    RelativeValuesDefinitionPageFragment,
    definitionRef
  );
  const revision = useFragment<RelativeValuesDefinitionRevision$key>(
    RelativeValuesDefinitionRevisionFragment,
    definition.currentRevision
  );

  const [saveMutation, isSaveInFlight] =
    useMutation<EditRelativeValuesDefinitionMutation>(Mutation);

  const save = (data: RelativeValuesDefinitionFormShape) => {
    saveMutation({
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
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          // TODO - go to definition page instead?
          router.push("/");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
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
