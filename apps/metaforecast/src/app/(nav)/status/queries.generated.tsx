import * as Types from '../../../graphql/types.generated';

import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type PlatformsStatusQueryVariables = Types.Exact<{ [key: string]: never; }>;


export type PlatformsStatusQuery = { __typename?: 'Query', result: Array<{ __typename?: 'Platform', id: string, label: string, lastUpdated?: number | null }> };


export const PlatformsStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"PlatformsStatus"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","alias":{"kind":"Name","value":"result"},"name":{"kind":"Name","value":"platforms"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"lastUpdated"}}]}}]}}]} as unknown as DocumentNode<PlatformsStatusQuery, PlatformsStatusQueryVariables>;