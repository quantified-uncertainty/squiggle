import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";
import { useSession } from "next-auth/react";
import { useLazyLoadQuery } from "react-relay";

import { DropdownMenu } from "@quri/ui";

import { EntityInfo } from "@/components/EntityInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { DotsDropdownButton } from "@/components/ui/DotsDropdownButton";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { modelEditRoute, modelRevisionsRoute, modelRoute } from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import {
  ModelRevisionForRelativeValuesInput,
  QueryModelInput,
} from "@/__generated__/ModelPageQuery.graphql";
import { ModelPageQuery as ModelPageQueryType } from "@gen/ModelPageQuery.graphql";

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
    <WithTopMenu addMarginToMainSection={false}>
      <div className="flex items-center gap-4 px-4 bg-gray-200 pt-5 pb-4 border-b border-gray-300">
        <EntityInfo slug={slug} username={username} />
        <StyledTabLink.List>
          <StyledTabLink name="View" href={modelRoute({ username, slug })} />
          <StyledTabLink
            name="Editor"
            href={modelEditRoute({ username, slug })}
          />
          <StyledTabLink
            name="Revisions"
            href={modelRevisionsRoute({ username, slug })}
          />
        </StyledTabLink.List>
        {session?.user.username === username ? (
          <MenuButton username={username} slug={slug} />
        ) : null}
      </div>
      {children}
    </WithTopMenu>
  );
};
