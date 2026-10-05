#!/usr/bin/env bash
SKILLS_DIR="$HOME/.claude/skills"
echo "Claude Skills 目录：$SKILLS_DIR"
for name in docx pdf pptx xlsx frontend-design web-artifacts-builder webapp-testing skill-creator literature-review; do
  if [ -f "$SKILLS_DIR/$name/SKILL.md" ]; then
    echo "[OK] $name"
  else
    echo "[缺失] $name"
  fi
done
echo "research 和 last30days 属于 Claude Code plugin，请在 Claude Code 内用 /plugin 检查。"
