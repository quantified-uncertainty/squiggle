"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql } from "relay-runtime";

import { NewDefinitionMutation } from "@/__generated__/NewDefinitionMutation.graphql";
import { Header } from "@/components/ui/Header";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import {
  RelativeValuesDefinitionForm,
  RelativeValuesDefinitionFormShape,
} from "@/relative-values/components/RelativeValuesDefinitionForm";

const Mutation = graphql`
  mutation NewDefinitionMutation(
    $input: MutationCreateRelativeValuesDefinitionInput!
  ) {
    result: createRelativeValuesDefinition(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on CreateRelativeValuesDefinitionResult {
        definition {
          id
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
  });

  const save = (data: RelativeValuesDefinitionFormShape) => {
    runMutation({
      variables: {
        input: {
          slug: data.slug,
          title: data.title,
          items: data.items,
          clusters: data.clusters,
        },
      },
      onCompleted: () => {
        // TODO - go to definition page instead?
        router.push("/");
      },
    });
  };

  return (
    <div>
      <Header size="large">New Relative Values definition</Header>
      <RelativeValuesDefinitionForm save={save} />
    </div>
  );
};
