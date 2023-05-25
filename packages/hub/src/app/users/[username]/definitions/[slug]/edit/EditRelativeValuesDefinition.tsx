import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { graphql, useFragment, useMutation } from "react-relay";

import { useToast } from "@quri/ui";

import { DefinitionPage$key } from "@/__generated__/DefinitionPage.graphql";
import { DefinitionRevision$key } from "@/__generated__/DefinitionRevision.graphql";
import { EditRelativeValuesDefinitionMutation } from "@/__generated__/EditRelativeValuesDefinitionMutation.graphql";
import { RelativeValuesDefinition$key } from "@/__generated__/RelativeValuesDefinition.graphql";
import { RelativeValuesDefinitionFragment } from "@/components/RelativeValuesDefinition";
import {
  RelativeValuesDefinitionForm,
  RelativeValuesDefinitionFormShape,
} from "@/relative-values/RelativeValuesDefinitionForm";
import { DefinitionPageFragment } from "../DefinitionPage";
import { DefinitionRevisionFragment } from "../DefinitionRevision";

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

type Props = {
  definitionRef: DefinitionPage$key;
};

export const EditRelativeValuesDefinition: FC<Props> = ({ definitionRef }) => {
  useSession({ required: true });

  const toast = useToast();

  const router = useRouter();

  const definition = useFragment(DefinitionPageFragment, definitionRef);
  const revision = useFragment<DefinitionRevision$key>(
    DefinitionRevisionFragment,
    definition.currentRevision
  );
  const content = useFragment<RelativeValuesDefinition$key>(
    RelativeValuesDefinitionFragment,
    revision.content
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
    <div className="mx-auto max-w-2xl">
      <RelativeValuesDefinitionForm
        defaultValues={{
          title: content.title,
          items: content.items,
          clusters: content.clusters,
        }}
        withoutSlug
        save={save}
      />
    </div>
  );
};
