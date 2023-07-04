#!/bin/bash

# Common installCommand script for vercel.json configs.
# See also: https://github.com/orgs/vercel/discussions/222

set -e

# Yarn cache folder on Vercel must be inside node_modules to be reused.
VERCEL_CACHE=../../node_modules/.yarn-cache
# Default cache location.
DEFAULT_CACHE=../../.yarn/cache

if [ -d "$VERCEL_CACHE" ]; then
    echo "$VERCEL_CACHE exists"
    # Note that we use `yarn workspaces focus` instead of full `yarn install`.
    # That way we install only the subset of all monorepo dependencies,
    # and also check that the project lists its dependencies correctly.
    YARN_CACHE_FOLDER=$VERCEL_CACHE yarn workspaces focus
else
    # Yarn fails when cache folder is in node_modules but it doesn't exist.
    echo "Initial install with $DEFAULT_CACHE"
    yarn install --immutable
    echo mv $DEFAULT_CACHE $VERCEL_CACHE
    mv $DEFAULT_CACHE $VERCEL_CACHE
fi
