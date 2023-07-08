import { formatDistance } from "date-fns";
import { FC } from "react";
import { useFragment } from "react-relay";
import { graphql } from "relay-runtime";

import { ModelCard$key } from "@/__generated__/ModelCard.graphql";
import { UserLink } from "@/components/UserLink";
import { StyledLink } from "@/components/ui/StyledLink";
import { modelRoute, modelForRelativeValuesExportRoute } from "@/routes";
import { CodeBracketIcon, LinkIcon, ScaleIcon } from "@quri/ui";

const Fragment = graphql`
  fragment ModelCard on Model {
    slug
    createdAtTimestamp
    owner {
      username
      ...UserLinkFragment
    }
    currentRevision {
      relativeValuesExports {
        variableName
        definition {
          slug
        }
      }
    }
  }
`;

type Props = {
  modelRef: ModelCard$key;
  showOwner?: boolean;
};

export const ModelCard: FC<Props> = ({ modelRef, showOwner }) => {
  const model = useFragment(Fragment, modelRef);
  const exports = model.currentRevision.relativeValuesExports;

  return (
    <div className="border p-3 rounded flex">
      <CodeBracketIcon size={20} className="mt-3 ml-1 mr-3 text-slate-300" />
      <div>
        <div className="mb-1">
          <StyledLink
            href={modelRoute({
              username: model.owner.username,
              slug: model.slug,
            })}
            className="hover:underline text-md font-medium"
          >
            {`${!!showOwner ? model.owner.username + "/" : ""}${model.slug}`}
          </StyledLink>
        </div>
        <div className="text-xs text-slate-500">
          Created{" "}
          <time dateTime={new Date(model.createdAtTimestamp).toISOString()}>
            {formatDistance(new Date(model.createdAtTimestamp), new Date(), {
              addSuffix: true,
            })}
          </time>
        </div>
        {exports.length > 0 && (
          <div className="mt-2">
            {model.currentRevision.relativeValuesExports.map((e, i) => (
              <StyledLink
                key={i}
                href={modelForRelativeValuesExportRoute({
                  username: model.owner.username,
                  slug: model.slug,
                  variableName: e.variableName,
                })}
                className="items-center flex hover:underline font-mono text-xs"
              >
                <ScaleIcon size={14} className="opacity-60" />
                <span className="flex ml-1">{`${e.variableName}:${e.definition.slug}`}</span>
              </StyledLink>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
