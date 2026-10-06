#!/bin/bash
# Install the Python dependencies of the project skills in Claude Code cloud sessions.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

SKILLS="$CLAUDE_PROJECT_DIR/.claude/skills"
PIP=(pip install --quiet --disable-pip-version-check --root-user-action=ignore)

# Debian ships blinker 1.7 without a RECORD file, so pip cannot upgrade it in
# place for flask (needs >=1.9). Install the newer one alongside it first.
if ! python3 -c 'import importlib.metadata as m, sys; v = tuple(int(x) for x in m.version("blinker").split(".")[:2]); sys.exit(v < (1, 9))' 2>/dev/null; then
  "${PIP[@]}" --ignore-installed --no-deps 'blinker>=1.9'
fi

"${PIP[@]}" -r "$SKILLS/ppt-master/requirements.txt"

# webapp-testing drives the preinstalled Chromium in $PLAYWRIGHT_BROWSERS_PATH
# (chromium-1194); playwright 1.56.0 is the release built against that revision.
"${PIP[@]}" 'playwright==1.56.0'
