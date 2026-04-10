#!/bin/bash
# Generate release-please config for the current branch
# Usage: ./scripts/generate-release-config.sh [dev|next|main]

BRANCH=${1:-main}
CONFIG_FILE="release-please-config.dynamic.json"

cat > "$CONFIG_FILE" <<EOF
{
  "release-type": "node",
  "packages": {
    ".": {
      "package-name": "tsneedle",
      "changelog-path": "CHANGELOG.md"
$(if [ "$BRANCH" != "main" ]; then
  cat <<INNER
,
      "prerelease": true,
      "prerelease-type": "$BRANCH",
      "versioning": "prerelease"
INNER
fi)
    }
  },
  "changelog-path": "CHANGELOG.md",
  "separate-pull-requests": false,
  "include-component-in-tag": false,
  "includeVInTag": true,
$(if [ "$BRANCH" = "main" ]; then
  echo '  "prerelease": false,'
else
  echo '  "prerelease": true,'
fi)
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": true,
  "versioning": "default",
  "changelog-sections": [
    { "type": "feat", "section": "Features" },
    { "type": "fix", "section": "Bug Fixes" },
    { "type": "perf", "section": "Performance Improvements" },
    { "type": "revert", "section": "Reverts" },
    { "type": "docs", "section": "Documentation" },
    { "type": "style", "section": "Styles", "hidden": true },
    { "type": "refactor", "section": "Code Refactoring", "hidden": false },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "build", "section": "Build System", "hidden": true },
    { "type": "ci", "section": "CI", "hidden": true }
  ],
  "\$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json"
}
EOF

echo "$CONFIG_FILE"
