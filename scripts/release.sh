#!/usr/bin/env bash
# Tag a release.
# Usage: scripts/release.sh 0.3.0

set -euo pipefail
VERSION="${1:?usage: release.sh <semver>}"
TAG="v${VERSION}"

if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]]; then
  echo "Invalid semver: $VERSION"; exit 1
fi

git fetch --tags
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists"; exit 1
fi

git tag -a "$TAG" -m "Release $TAG"
git push origin "$TAG"

echo "✓ Tagged $TAG. Remember to update logs/deployment-log.md after the deploy."
