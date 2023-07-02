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
    # `yarn workspaces focus` would be better, but it causes issues because of Vercel/Github mismatch.
    # See https://github.com/quantified-uncertainty/squiggle/issues/1797#issuecomment-1616186996 for details.
    YARN_CACHE_FOLDER=$VERCEL_CACHE yarn install --immutable
else
    # Yarn fails when cache folder is in node_modules but it doesn't exist.
    echo "Initial install with $DEFAULT_CACHE"
    yarn install --immutable
    echo mv $DEFAULT_CACHE $VERCEL_CACHE
    mv $DEFAULT_CACHE $VERCEL_CACHE
fi
