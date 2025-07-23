#!/bin/bash
# Update all git submodules to the latest commit on their respective branches
set -e

echo "Updating git submodules..."
git submodule update --init --recursive
git submodule foreach --recursive git fetch origin
#git submodule foreach --recursive git checkout origin/$(git rev-parse --abbrev-ref HEAD)
git submodule foreach --recursive git pull
echo "Submodules are up-to-date."
