# 工作区

本仓库内置五个 Claude Code 项目技能，放在 `.claude/skills/` 下。在这个仓库里打开 Claude Code，直接用中文说需求即可。

| 技能 | 用途 | 这样说 |
|---|---|---|
| `ppt-master` | 从文档生成可编辑的 PPT | 用这份材料做一份 PPT |
| `literature-review` | 系统文献综述、引用核验 | 对智慧物流近 5 年文献做综述 |
| `frontend-design` | 网站/UI 视觉设计 | 帮我设计一个产品介绍页 |
| `web-artifacts-builder` | 多组件 React 交互网页（单个 HTML） | 做一个带筛选和图表的交互网页 |
| `webapp-testing` | 用 Playwright 实际打开网页测试、截图、找 Bug | 测试这个网页，最多修复 2 轮 |

- Word、PDF、PPT、Excel 和 skill-creator 不放在仓库里：云端会话已自带（来自 claude.ai 账号）。
- 云端会话启动时，`.claude/hooks/session-start.sh` 会自动安装 Python 依赖，包括 webapp-testing 用的 `playwright==1.56.0`（与云端预装的 Chromium 配套）。
- 云端用 webapp-testing 测本地网页时，地址写 `http://127.0.0.1:端口`，不要写 `localhost`。
- 本地使用需先执行一次：
  `pip install requests -r .claude/skills/ppt-master/requirements.txt`
  用 webapp-testing 还需：`pip install playwright && python -m playwright install chromium`

## 考研学习框架

`learning-framework/kaoyan-framework.html`：交互式考研学习页面，适合零基础，按“今天学 / 知识地图 / 错题本 / 备考计划 / 成绩复盘”五页组织。

- **今天学**：每科列出接下来要学的 2–3 个知识点，按教材章节顺序往下走；显示是否跟上计划，还没到开始时间的科目（如政治、专业课）会说明何时开始。
- **知识地图**：数学（一/二/三按大纲区分章节）、英语（一/二）、政治、管综的第一轮知识点，标注同济高数、线代和浙大概率的章节；专业课可选用内置的 810 管理学（周三多《管理学——原理与方法》第七版，按上海海事大学考试大纲七部分整理）或 809 运筹学（清华版）大纲，也可填写科目名称让 Claude 生成。
- **讲给我听 / 出题练练**：在 claude.ai 中打开时，页面内的 Claude 会从零讲解知识点（公式用 MathJax 渲染）、出题并批改；每个知识点也有 B 站搜索链接。
- **今日复习**：勾选“学会了”的知识点会在第 1、2、4、7、15、30 天回到「今天学」顶部，点“记得 / 忘了”自动排下一次；“考考我”让 Claude 出两道回忆题。
- **错题本**：记题目、章节、错因（知识盲区 / 方法不熟 / 审题计算 / 时间不够），按同样的间隔复习，连续 3 次做对算掌握；可让 Claude 讲解错题，周复盘会自动统计本周错因。
- **讲解笔记**：Claude 的讲解可以“存为笔记”，以后点“看笔记”直接打开，不再等待、不耗额度。
- **备考计划**：倒排时间线、报名节点、阶段事务清单、每周节奏和学习方法；**成绩复盘**：真题/模考分数趋势和每周复盘。
- 进度按人私密保存到 claude.ai 账号；直接用浏览器打开本地文件时只存在该浏览器，讲解功能不可用。
- 2027 考研（2026 年 12 月考）日期：预报名 10-09～12，正式报名 10-15～24，初试 12-19～20。2028 考研（2027 年 12 月考）日期尚未公布，页面按 12 月 18–19 日估算。

## research 和 last30days

这两个是 Claude Code 插件，不是普通技能。云端会话不会安装插件（仓库 `.claude/settings.json` 里声明的也不会），所以不放进本仓库。

- **research**（Melodic Software 的 discovery 插件）：在 [claude.ai › Customize › Plugins](https://claude.ai/customize/plugins) 选 **Add › Add marketplace**，填 `melodic-software/claude-code-plugins`，再添加 `discovery`。之后它随账号同步到 Claude Code，不用每次安装，新会话里用 `/plugin` 可确认已加载。走这条路的话，本地就不必再执行 `03_…txt` 里 discovery 那两行。常驻开销约 1.1k token（7 个技能和 5 个子代理的说明）。
- **last30days**：只建议在自己电脑上用。它要求 Python 3.12 以上（云端是 3.11），每次调用会读入约 64k token 的说明，多数数据源还需要 API Key 或浏览器 Cookie。
- 在自己电脑上安装：见 `yangliping_claude_skills_kit/03_在Claude_Code里粘贴这些命令.txt`。

## 安装工具包（yangliping_claude_skills_kit）

给自己电脑用的一键安装包：把上面的技能和 Anthropic 官方的 docx/pdf/pptx/xlsx/skill-creator 装到 `~/.claude/skills/`。先看其中的 `README_先看我.md`。

## ppt-master

[ppt-master](https://github.com/hugohe3/ppt-master) v6.6.0（上游提交 `44c10ed0`），位于 `.claude/skills/ppt-master/`。

### 更新 ppt-master

```bash
git clone --depth 1 https://github.com/hugohe3/ppt-master.git /tmp/ppt-master
rm -rf .claude/skills/ppt-master
cp -r /tmp/ppt-master/skills/ppt-master .claude/skills/ppt-master
```

## 其余四个技能的来源与更新

| 技能 | 上游 | 提交 | 许可证 |
|---|---|---|---|
| `frontend-design`、`web-artifacts-builder`、`webapp-testing` | [anthropics/skills](https://github.com/anthropics/skills) | `8a1541c` | Apache-2.0 |
| `literature-review` | [pinshuai/literature-review-skill](https://github.com/pinshuai/literature-review-skill) | `ed62a28` | MIT |

```bash
git clone --depth 1 https://github.com/anthropics/skills.git /tmp/anthropic-skills
for s in frontend-design web-artifacts-builder webapp-testing; do
  rm -rf .claude/skills/$s && cp -r /tmp/anthropic-skills/skills/$s .claude/skills/$s
done

git clone --depth 1 https://github.com/pinshuai/literature-review-skill.git /tmp/literature-review
rm -rf .claude/skills/literature-review && mkdir -p .claude/skills/literature-review
cp -r /tmp/literature-review/{SKILL.md,assets,references,scripts,LICENSE} .claude/skills/literature-review/
```
