"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { useMutation } from "react-relay";
import { graphql } from "relay-runtime";

import { useToast } from "@quri/ui";

import { NewDefinitionMutation } from "@/__generated__/NewDefinitionMutation.graphql";
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

  const toast = useToast();

  const router = useRouter();

  const [saveMutation, isSaveInFlight] =
    useMutation<NewDefinitionMutation>(Mutation);

  const save = (data: RelativeValuesDefinitionFormShape) => {
    saveMutation({
      variables: {
        input: {
          slug: data.slug,
          title: data.title,
          items: data.items,
          clusters: data.clusters,
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
    <div>
      <div className="font-bold text-xl mb-4">
        New Relative Values definition
      </div>
      <RelativeValuesDefinitionForm save={save} />
    </div>
  );
};
