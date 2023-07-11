import { useSession } from "next-auth/react";
import { usePathname, useRouter, useParams } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { useLazyLoadQuery } from "react-relay";
import { graphql } from "relay-runtime";

import {
  DropdownMenu,
  DropdownMenuHeader,
  DropdownMenuSeparator,
  TriangleIcon,
  EditIcon,
  ScaleIcon,
  Dropdown,
  Cog8ToothIcon,
  CodeBracketSquareIcon,
  BackwardIcon,
  ArrowUturnLeftIcon,
  RectangleStackIcon,
} from "@quri/ui";

import {
  ModelLayoutQuery,
  ModelLayoutQuery$data,
} from "@/__generated__/ModelLayoutQuery.graphql";
import { EntityLayout, EntityNode } from "@/components/EntityLayout";
import { DropdownMenuLinkItem } from "@/components/ui/DropdownMenuLinkItem";
import { EntityTab } from "@/components/ui/EntityTab";
import {
  modelForRelativeValuesExportRoute,
  modelRevisionsRoute,
  modelRoute,
  modelViewRoute,
  patchModelRoute,
  userRoute,
} from "@/routes";
import { DeleteModelAction } from "./DeleteModelAction";
import { UpdateModelSlugAction } from "./UpdateModelSlugAction";
import { CodeBracketIcon } from "@quri/ui";

// Doing this with a fragment would be too hard, because of how layouts work in Next.js.
// So we have to do two GraphQL queries on most model pages.
const Query = graphql`
  query ModelLayoutQuery($input: QueryModelInput!) {
    model(input: $input) {
      id
      slug
      owner {
        username
      }
      currentRevision {
        id
        # for length; TODO - "hasExports" field?
        relativeValuesExports {
          id
          variableName
          definition {
            slug
            owner {
              username
            }
          }
        }
      }
    }
  }
`;

type CommonProps = {
  username: string;
  slug: string;
};

const MenuButton: FC<CommonProps> = ({ username, slug }) => {
  return (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelSlugAction
            username={username}
            slug={slug}
            close={close}
          />
          <DeleteModelAction username={username} slug={slug} close={close} />
        </DropdownMenu>
      )}
    >
      <EntityTab.Div name="Settings" icon={Cog8ToothIcon} />
    </Dropdown>
  );
};

function useFixModelUrlCasing(model: ModelLayoutQuery$data["model"]) {
  const router = useRouter();
  const pathname = usePathname();

  const patchedPathname = patchModelRoute({
    pathname,
    slug: model.slug,
    username: model.owner.username,
  });
  if (patchedPathname && patchedPathname !== pathname) {
    router.replace(patchedPathname);
  }
}

type Props = PropsWithChildren<CommonProps>;

export const EntityNodes = (
  username: string,
  slug: string,
  variableName?: string
): EntityNode[] => {
  let nodes: EntityNode[] = [
    { slug: username, href: userRoute({ username }) },
    { slug, href: modelRoute({ username, slug }), icon: CodeBracketIcon },
  ];
  if (variableName) {
    nodes.push({
      slug: variableName,
      href: modelForRelativeValuesExportRoute({
        username: username,
        slug: slug,
        variableName: variableName,
      }),
      icon: ScaleIcon,
    });
  }
  return nodes;
};

export const ModelLayout: FC<Props> = ({ username, slug, children }) => {
  const { data: session } = useSession();
  const { variableName } = useParams();

  const { model } = useLazyLoadQuery<ModelLayoutQuery>(Query, {
    input: { ownerUsername: username, slug },
  });

  useFixModelUrlCasing(model);

  const dropDown = (close: () => void) => (
    <DropdownMenu>
      <DropdownMenuHeader> Relative Value Functions </DropdownMenuHeader>
      <DropdownMenuSeparator />
      {model.currentRevision.relativeValuesExports.map((exportItem) => (
        <DropdownMenuLinkItem
          key={exportItem.variableName}
          href={modelForRelativeValuesExportRoute({
            username: model.owner.username,
            slug: model.slug,
            variableName: exportItem.variableName,
          })}
          title={`${exportItem.variableName}: ${exportItem.definition.slug}`}
          icon={ScaleIcon}
          close={close}
        />
      ))}
    </DropdownMenu>
  );

  return (
    <EntityLayout
      nodes={EntityNodes(username, slug, variableName)}
      isFluid={true}
      headerChildren={
        <>
          <EntityTab.List>
            <EntityTab.Link
              name="Code"
              icon={CodeBracketIcon}
              href={modelRoute({ username, slug })}
            />
            {Boolean(model.currentRevision.relativeValuesExports.length) && (
              <Dropdown render={({ close }) => dropDown(close)}>
                <EntityTab.Div
                  name="Exports"
                  icon={ScaleIcon}
                  count={model.currentRevision.relativeValuesExports.length}
                  selected={(pathname) => {
                    return pathname.startsWith(
                      modelRoute({ username, slug }) + "/relative-values"
                    );
                  }}
                />
              </Dropdown>
            )}
            <EntityTab.Link
              name="Revisions"
              icon={RectangleStackIcon}
              href={modelRevisionsRoute({ username, slug })}
            />
            {session?.user.username === username ? (
              <MenuButton username={username} slug={slug} />
            ) : null}
          </EntityTab.List>
        </>
      }
    >
      {children}
    </EntityLayout>
  );
};
