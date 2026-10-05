# 杨黎平 Claude Skills 安装工具包

适用：Claude Code
生成日期：2026-10-05

## 推荐安装的核心 Skill

### Anthropic 官方（8个）
1. docx — Word 创建/修改/格式处理
2. pdf — PDF 读取/生成/拆分/提取
3. pptx — PPT 创建/修改/布局
4. xlsx — Excel/公式/数据分析/图表
5. frontend-design — 网站/UI设计
6. web-artifacts-builder — 复杂 Claude Artifact / React 交互网页
7. webapp-testing — 自动测试网页、找 Bug
8. skill-creator — 创建和优化自己的 Skill

### 第三方（3类）
9. research — 多来源研究、核验、反证（Melodic Software 的 discovery 插件内）
10. literature-review — 系统文献综述、DOI/文献核验（pinshuai/literature-review-skill）
11. last30days — 最近30天 GitHub/Reddit/HN 等趋势研究

## 最推荐的安装方式

### 第一步：安装 8 个 Anthropic 官方 Skill + literature-review

Windows：
右键 `01_安装核心Skills_Windows.ps1` → 使用 PowerShell 运行。
如果执行策略阻止，可在 PowerShell 中运行：

powershell -ExecutionPolicy Bypass -File .\01_安装核心Skills_Windows.ps1

macOS / Linux：

chmod +x 02_安装核心Skills_macOS_Linux.sh
./02_安装核心Skills_macOS_Linux.sh

这两个脚本只做三件事：
- 检查 git
- 从 GitHub 官方/原作者仓库下载
- 把指定 Skill 复制到 ~/.claude/skills/

### 第二步：在 Claude Code 里面安装 research 和 last30days

打开 Claude Code，把 `03_在Claude_Code里粘贴这些命令.txt` 里的命令逐行执行。

## 装完以后怎么用？

通常不需要手动打开 Skill。直接自然语言告诉 Claude 任务即可，Claude 会根据 Skill 的 description 自动选择。

例如：

- “使用 docx skill 修改这个 Word，保持原格式不变，只修改正文。”
- “先使用 research 核验这组数据，再写论文。”
- “使用 literature-review 对智慧物流近5年文献做综述。”
- “使用 webapp-testing 测试这个网页，最多修复2轮。”
- “使用 last30days 查最近30天 AI Agent 在 GitHub 的热门项目。”

你也可以直接说：

“请自行选择已安装的 Skills 完成任务；优先保证数据真实性和 Token 效率，不要加载无关文件。”

## Token 节省建议

建议把 `05_低Token项目规则_CLAUDE.md` 复制到经常使用的项目根目录并改名为 `CLAUDE.md`。

核心规则：
- 搜索后再读取，不要先读整个项目
- 只读当前任务相关文件
- 最多 2~3 轮自动修复
- 改局部，不全文重写
- 阶段结束写摘要，再开新会话

## 安全说明

Anthropic 官方 Skill 来源：
https://github.com/anthropics/skills

research/discovery 来源：
https://github.com/melodic-software/claude-code-plugins

literature-review 来源：
https://github.com/pinshuai/literature-review-skill

last30days 来源：
https://github.com/mvanhorn/last30days-skill

第三方 Skill 不属于 Anthropic 官方产品。脚本不会静默执行第三方 Skill，只负责下载/复制；research 和 last30days 仍要求你在 Claude Code 中显式安装。
