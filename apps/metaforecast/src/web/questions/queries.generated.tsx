import * as Types from "../../graphql/types.generated";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type QuestionPageQueryVariables = Types.Exact<{
  id: Types.Scalars["ID"]["input"];
}>;

export type QuestionPageQuery = {
  __typename?: "Query";
  result?: {
    __typename?: "Question";
    id: string;
    url: string;
    title: string;
    description: string;
    fetched: number;
    visualization?: string | null;
    history: Array<{
      __typename?: "History";
      fetched: number;
      options: Array<{
        __typename?: "ProbabilityOption";
        name?: string | null;
        probability?: number | null;
      }>;
    }>;
    options: Array<{
      __typename?: "ProbabilityOption";
      name?: string | null;
      probability?: number | null;
    }>;
    platform: { __typename?: "Platform"; id: string; label: string };
    qualityIndicators: {
      __typename?: "QualityIndicators";
      stars: number;
      numForecasts?: number | null;
      numForecasters?: number | null;
      volume?: number | null;
      spread?: number | null;
      sharesVolume?: number | null;
      openInterest?: number | null;
      liquidity?: number | null;
      tradeVolume?: number | null;
    };
  } | null;
};

export const QuestionPageDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "QuestionPage" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
          type: {
            kind: "NonNullType",
            type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "result" },
            name: { kind: "Name", value: "question" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "id" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "id" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "QuestionWithHistory" },
                },
              ],
            },
          },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "Question" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Question" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "url" } },
          { kind: "Field", name: { kind: "Name", value: "title" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "fetched" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "options" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "name" } },
                { kind: "Field", name: { kind: "Name", value: "probability" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "platform" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "id" } },
                { kind: "Field", name: { kind: "Name", value: "label" } },
              ],
            },
          },
          {
            kind: "Field",
            name: { kind: "Name", value: "qualityIndicators" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "stars" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "numForecasts" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "numForecasters" },
                },
                { kind: "Field", name: { kind: "Name", value: "volume" } },
                { kind: "Field", name: { kind: "Name", value: "spread" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "sharesVolume" },
                },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "openInterest" },
                },
                { kind: "Field", name: { kind: "Name", value: "liquidity" } },
                { kind: "Field", name: { kind: "Name", value: "tradeVolume" } },
              ],
            },
          },
          { kind: "Field", name: { kind: "Name", value: "visualization" } },
        ],
      },
    },
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "QuestionWithHistory" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Question" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "FragmentSpread", name: { kind: "Name", value: "Question" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "history" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                { kind: "Field", name: { kind: "Name", value: "fetched" } },
                {
                  kind: "Field",
                  name: { kind: "Name", value: "options" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      { kind: "Field", name: { kind: "Name", value: "name" } },
                      {
                        kind: "Field",
                        name: { kind: "Name", value: "probability" },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<QuestionPageQuery, QuestionPageQueryVariables>;
