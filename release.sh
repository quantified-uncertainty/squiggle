#!/bin/bash

# This script is incomplete / work-in-progress.

set -e

publish_npm () {
    # doesn't support prereleases yet
    changeset publish
}

publish_vsce () {
    local opts=""
    if [ -n "$ALPHA" ]; then
        opts="--pre-release"
    fi
    cd packages/vscode-ext
    # You need personal access token for this, see https://code.visualstudio.com/api/working-with-extensions/publishing-extension#create-a-publisher
    vsce publish $opts
    cd -
}

publish_npm
publish_vsce
