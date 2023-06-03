#!/bin/env bash

# idea from https://stackoverflow.com/questions/75232060/stop-vercel-preview-deployments-on-dependabot-prs
if [ "$VERCEL_GIT_COMMIT_AUTHOR_LOGIN" == "dependabot[bot]" ]; then exit 0; else exit 1; fi
