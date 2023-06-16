import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";
import { useSession } from "next-auth/react";
import { useLazyLoadQuery } from "react-relay";

import { DropdownMenu } from "@quri/ui";

import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { modelRevisionsRoute, modelRoute } from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import {
  ModelRevisionForRelativeValuesInput,
  QueryModelInput,
} from "@/__generated__/ModelPageQuery.graphql";
import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";
import { EntityLayout } from "@/components/Entity";

export const ModelPageFragment = graphql`
  fragment ModelPage on Model
  @argumentDefinitions(
    forRelativeValues: { type: "ModelRevisionForRelativeValuesInput" }
  ) {
    id
    slug
    owner {
      username
    }
    currentRevision {
      content {
        __typename
      }
      ...ModelRevision @arguments(forRelativeValues: $forRelativeValues)
    }
  }
`;

const ModelPageQuery = graphql`
  query ModelPageQuery(
    $input: QueryModelInput!
    $forRelativeValues: ModelRevisionForRelativeValuesInput
  ) {
    model(input: $input) {
      ...ModelPage @arguments(forRelativeValues: $forRelativeValues)
    }
  }
`;

// This is a common query used in multiple nested pages, but it should be de-duped by Next.js caching mechanisms.
export function useModelPageQuery(
  input: QueryModelInput,
  forRelativeValues?: ModelRevisionForRelativeValuesInput
) {
  const { model: modelRef } = useLazyLoadQuery<ModelPageQueryType>(
    ModelPageQuery,
    { input, forRelativeValues }
  );

  return modelRef;
}

type CommonProps = {
  username: string;
  slug: string;
};

const MenuButton: FC<CommonProps> = ({ username, slug }) => {
  return (
    <DotsDropdownButton>
      {({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            username={username}
            slug={slug}
            close={close}
          />
          <DeleteModelAction username={username} slug={slug} close={close} />
        </DropdownMenu>
      )}
    </DotsDropdownButton>
  );
};

type Props = PropsWithChildren<CommonProps>;

export const ModelPage: FC<Props> = ({ username, slug, children }) => {
  const { data: session } = useSession();

  return (
    <EntityLayout
      slug={slug}
      username={username}
      homepageUrl={modelRoute({ username, slug })}
      isFluid={true}
      headerChildren={
        <>
          <StyledTabLink.List>
            <StyledTabLink
              name="Editor"
              href={modelRoute({ username, slug })}
            />
            <StyledTabLink
              name="Revisions"
              href={modelRevisionsRoute({ username, slug })}
            />
          </StyledTabLink.List>
          {session?.user.username === username ? (
            <MenuButton username={username} slug={slug} />
          ) : null}
        </>
      }
    >
      {children}
    </EntityLayout>
  );
};
