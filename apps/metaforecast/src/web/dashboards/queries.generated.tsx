import * as Types from "../../graphql/types.generated";

import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type DashboardFragment = {
  __typename?: "Dashboard";
  id: string;
  title: string;
  description: string;
  creator: string;
  questions: Array<{
    __typename?: "Question";
    id: string;
    url: string;
    title: string;
    description: string;
    fetched: number;
    visualization?: string | null;
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
  }>;
};

export type DashboardByIdQueryVariables = Types.Exact<{
  id: Types.Scalars["ID"]["input"];
}>;

export type DashboardByIdQuery = {
  __typename?: "Query";
  result?: {
    __typename?: "Dashboard";
    id: string;
    title: string;
    description: string;
    creator: string;
    questions: Array<{
      __typename?: "Question";
      id: string;
      url: string;
      title: string;
      description: string;
      fetched: number;
      visualization?: string | null;
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
    }>;
  } | null;
};

export type CreateDashboardMutationVariables = Types.Exact<{
  input: Types.CreateDashboardInput;
}>;

export type CreateDashboardMutation = {
  __typename?: "Mutation";
  result: {
    __typename?: "CreateDashboardResult";
    dashboard: {
      __typename?: "Dashboard";
      id: string;
      title: string;
      description: string;
      creator: string;
      questions: Array<{
        __typename?: "Question";
        id: string;
        url: string;
        title: string;
        description: string;
        fetched: number;
        visualization?: string | null;
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
      }>;
    };
  };
};

export const DashboardFragmentDoc = {
  kind: "Document",
  definitions: [
    {
      kind: "FragmentDefinition",
      name: { kind: "Name", value: "Dashboard" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Dashboard" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "title" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "creator" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "questions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "Question" },
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
  ],
} as unknown as DocumentNode<DashboardFragment, unknown>;
export const DashboardByIdDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "query",
      name: { kind: "Name", value: "DashboardById" },
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
            name: { kind: "Name", value: "dashboard" },
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
                  name: { kind: "Name", value: "Dashboard" },
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
      name: { kind: "Name", value: "Dashboard" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Dashboard" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "title" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "creator" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "questions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "Question" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DashboardByIdQuery, DashboardByIdQueryVariables>;
export const CreateDashboardDocument = {
  kind: "Document",
  definitions: [
    {
      kind: "OperationDefinition",
      operation: "mutation",
      name: { kind: "Name", value: "CreateDashboard" },
      variableDefinitions: [
        {
          kind: "VariableDefinition",
          variable: {
            kind: "Variable",
            name: { kind: "Name", value: "input" },
          },
          type: {
            kind: "NonNullType",
            type: {
              kind: "NamedType",
              name: { kind: "Name", value: "CreateDashboardInput" },
            },
          },
        },
      ],
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          {
            kind: "Field",
            alias: { kind: "Name", value: "result" },
            name: { kind: "Name", value: "createDashboard" },
            arguments: [
              {
                kind: "Argument",
                name: { kind: "Name", value: "input" },
                value: {
                  kind: "Variable",
                  name: { kind: "Name", value: "input" },
                },
              },
            ],
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "Field",
                  name: { kind: "Name", value: "dashboard" },
                  selectionSet: {
                    kind: "SelectionSet",
                    selections: [
                      {
                        kind: "FragmentSpread",
                        name: { kind: "Name", value: "Dashboard" },
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
      name: { kind: "Name", value: "Dashboard" },
      typeCondition: {
        kind: "NamedType",
        name: { kind: "Name", value: "Dashboard" },
      },
      selectionSet: {
        kind: "SelectionSet",
        selections: [
          { kind: "Field", name: { kind: "Name", value: "id" } },
          { kind: "Field", name: { kind: "Name", value: "title" } },
          { kind: "Field", name: { kind: "Name", value: "description" } },
          { kind: "Field", name: { kind: "Name", value: "creator" } },
          {
            kind: "Field",
            name: { kind: "Name", value: "questions" },
            selectionSet: {
              kind: "SelectionSet",
              selections: [
                {
                  kind: "FragmentSpread",
                  name: { kind: "Name", value: "Question" },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<
  CreateDashboardMutation,
  CreateDashboardMutationVariables
>;
