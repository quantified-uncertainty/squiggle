"use client";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ModelExportList$key } from "@/__generated__/ModelExportList.graphql";
import { LoadMore } from "@/components/LoadMore";
// import { ModelExportCard } from "./ModelExportCard";

const Fragment = graphql`
  fragment ModelExportList on ModelConnection {
    edges {
      node {
        id
        slug
        isPrivate
        updatedAtTimestamp
        owner {
          slug
        }
        currentRevision {
          exports {
            variableName
            title
          }
        }
      }
    }
    pageInfo {
      hasNextPage
    }
  }
`;

type Props = {
  connectionRef: ModelExportList$key;
  loadNext(count: number): unknown;
  showOwner?: boolean;
};

type Model = {
  id: string;
  slug: string;
  isPrivate: boolean;
  updatedAtTimestamp: number;
  owner: {
    slug: string;
  };
};

type Export = {
  variableName: string;
  title?: string;
  model: Model;
};

export const ModelExportList: FC<Props> = ({
  connectionRef,
  loadNext,
  showOwner,
}) => {
  const connection = useFragment(Fragment, connectionRef);
  // const modelExports = connection.edges.map((edge: any) => {
  //   const model: Model = {
  //     id: edge.node.id,
  //     slug: edge.node.slug,
  //     isPrivate: edge.node.isPrivate,
  //     updatedAtTimestamp: edge.node.updatedAtTimestamp,
  //     owner: {
  //       slug: edge.node.owner.slug,
  //     },
  //   };
  //   const exports: Export[] = edge.node.currentRevision.exports.map(
  //     (rvExport: any) => {
  //       return {
  //         variableName: rvExport.variableName,
  //         title: rvExport.title,
  //         model,
  //       };
  //     }
  //   );
  //   return exports;
  // });

  // console.log("HIII", modelExports);
  return (
    <div>
      <div className="grid md:grid-cols-2 gap-4">
        {connection.edges.map(
          (edge: any) =>
            // <ModelExportCard
            //   key={edge.node.id}
            //   modelRef={edge.node}
            //   showOwner={showOwner}
            // />
            "HI"
        )}
      </div>
      {connection.pageInfo.hasNextPage && <LoadMore loadNext={loadNext} />}
    </div>
  );
};
