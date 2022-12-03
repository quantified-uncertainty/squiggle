#!/bin/bash

# This script is incomplete / work-in-progress.

set -e

if [ -z "$VERSION" ]; then
    echo "VERSION must be set!"
    exit 1
fi

publish_npm () {
    local opts=""
    if [ -n "$ALPHA" ]; then
        opts="--tag alpha"
    fi

    for d in packages/squiggle-lang packages/components; do
        # You need npm auth token to be set up, e.g. through `npm login`.
        # TODO: bump components -> squiggle-lang dependency!
        cd $d && yarn publish --non-interactive --no-git-tag-version --new-version "$VERSION" $opts && cd -
    done
}

publish_vsce () {
    local opts=""
    if [ -n "$ALPHA" ]; then
        opts="--pre-release"
    fi
    cd packages/vscode-ext
    yarn version --no-git-tag-version --new-version "$VERSION"
    # You need personal access token for this, see https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher
    vsce publish $opts
    cd -
}

publish_npm
publish_vsce
