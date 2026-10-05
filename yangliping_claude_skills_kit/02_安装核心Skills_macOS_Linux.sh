#!/usr/bin/env bash
set -euo pipefail

echo "=== 杨黎平 Claude Skills 安装器 ==="

if ! command -v git >/dev/null 2>&1; then
  echo "未检测到 git，请先安装 git。"
  exit 1
fi

SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

copy_skill() {
  src="$1"
  name="$2"
  rm -rf "$SKILLS_DIR/$name"
  cp -R "$src" "$SKILLS_DIR/$name"
  echo "[OK] $name"
}

echo "下载 Anthropic 官方 Skills..."
git clone --depth 1 https://github.com/anthropics/skills.git "$TMP_DIR/anthropics-skills"
for name in docx pdf pptx xlsx frontend-design web-artifacts-builder webapp-testing skill-creator; do
  copy_skill "$TMP_DIR/anthropics-skills/skills/$name" "$name"
done

echo "下载 literature-review..."
git clone --depth 1 https://github.com/pinshuai/literature-review-skill.git "$TMP_DIR/literature-review"
rm -rf "$SKILLS_DIR/literature-review"
mkdir -p "$SKILLS_DIR/literature-review"
for item in SKILL.md assets references scripts; do
  if [ -e "$TMP_DIR/literature-review/$item" ]; then
    cp -R "$TMP_DIR/literature-review/$item" "$SKILLS_DIR/literature-review/"
  fi
done
echo "[OK] literature-review"

echo
echo "核心 Skills 安装完成：$SKILLS_DIR"
echo "下一步：打开 Claude Code，执行 03_在Claude_Code里粘贴这些命令.txt 中的命令。"
