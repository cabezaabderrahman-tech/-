# 工作区

本仓库内置以下 Claude Code 项目技能，放在 `.claude/skills/` 下。在这个仓库里打开 Claude Code，直接用中文说需求即可。

| 技能 | 用途 | 这样说 |
|---|---|---|
| `ppt-master` | 从文档生成可编辑的 PPT | 用这份材料做一份 PPT |
| `paper-check` | 简体中文论文/作业查重 | 帮我查重这几篇论文 / 把这些加到比对库 |
| `remotion-*`（12 个） | 用 [Remotion](https://www.remotion.dev/) 以 React 代码制作、预览、渲染视频 | 用 Remotion 做一个产品介绍视频 |

- 云端会话启动时，`.claude/hooks/session-start.sh` 会自动安装 Python 依赖。
- 本地使用需先执行一次：
  `pip install -r .claude/skills/ppt-master/requirements.txt -r .claude/skills/paper-check/requirements.txt`

## 论文查重（paper-check）

按 [paper_checking_system](https://github.com/tianlian0/paper_checking_system) 公开的查重原理用 Python 重写，
支持纵向查重（与比对库比对）和横向查重（同批文件互相比对），读 PDF、DOCX、TXT，输出标红的 HTML 报告和 `result.csv`。

- 比对库存在 `paper_library/`，提交到仓库后永久保存。
- 只和比对库及同批文件比对，不连知网等外部数据库。
- 详细规则见 `.claude/skills/paper-check/SKILL.md`。

## ppt-master

[ppt-master](https://github.com/hugohe3/ppt-master) v6.6.0（上游提交 `44c10ed0`），位于 `.claude/skills/ppt-master/`。

### 更新 ppt-master

```bash
git clone --depth 1 https://github.com/hugohe3/ppt-master.git /tmp/ppt-master
rm -rf .claude/skills/ppt-master
cp -r /tmp/ppt-master/skills/ppt-master .claude/skills/ppt-master
```

## Remotion 技能

[remotion-dev/skills](https://github.com/remotion-dev/skills)（版本 4.0.533，上游提交 `47335261`），通过 `npx skills add` 安装到 `.claude/skills/remotion-*/`，
安装记录在根目录的 `skills-lock.json`。入口是 `remotion-best-practices`，它会按需转到其余技能
（`remotion-create`、`remotion-studio`、`remotion-render`、`remotion-captions`、`remotion-maps` 等）。

### 更新 Remotion 技能

```bash
npx skills add remotion-dev/skills --agent claude-code --skill '*' --copy -y
```
