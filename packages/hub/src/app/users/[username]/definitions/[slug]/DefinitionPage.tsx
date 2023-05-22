import { FC, PropsWithChildren } from "react";
import { graphql } from "relay-runtime";

import { EntityInfo } from "@/components/EntityInfo";
import { WithTopMenu } from "@/components/layout/WithTopMenu";
import { StyledTabLink } from "@/components/ui/StyledTabLink";
import { definitionRoute } from "@/routes";
import { Dropdown, DropdownMenu } from "@quri/ui";
import { DropdownButton } from "@/components/ui/DropdownButton";
import { DeleteDefinitionAction } from "./DeleteDefinitionAction";

export const DefinitionPageFragment = graphql`
  fragment DefinitionPage on Definition {
    id
    slug
    owner {
      username
    }
    ...DefinitionContent
  }
`;

export const DefinitionPageQuery = graphql`
  query DefinitionPageQuery($input: QueryDefinitionInput!) {
    definition(input: $input) {
      ...DefinitionPage
    }
  }
`;

type Props = PropsWithChildren<{
  username: string;
  slug: string;
}>;

export const DefinitionPage: FC<Props> = ({ username, slug, children }) => {
  return (
    <WithTopMenu>
      <div className="flex items-center gap-4 max-w-2xl mx-auto">
        <EntityInfo slug={slug} username={username} />
        <StyledTabLink.List>
          <StyledTabLink
            name="View"
            href={definitionRoute({ username, slug })}
          />
          {/* <StyledTabLink
            name="Edit"
            href={modelEditRoute({ username, slug })}
          />
          <StyledTabLink
            name="Revisions"
            href={modelRevisionsRoute({ username, slug })}
          /> */}
        </StyledTabLink.List>
        <DropdownButton>
          {({ close }) => (
            <DropdownMenu>
              <DeleteDefinitionAction
                username={username}
                slug={slug}
                close={close}
              />
            </DropdownMenu>
          )}
        </DropdownButton>
      </div>
      <div>{children}</div>
    </WithTopMenu>
  );
};
