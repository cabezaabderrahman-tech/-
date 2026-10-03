---
name: paper-check
description: >
  简体中文论文、作业、标书等文档的本地查重（纵向：与比对库比对；横向：同批文件互相比对），
  输出带标红的 HTML 查重报告和 result.csv 统计表。Use when the user asks to 查重、
  查重复率、检查抄袭、互相抄袭、添加/管理比对库, or to check plagiarism or duplication
  among Chinese PDF / DOCX / TXT documents.
---

# 论文查重

脚本：`${SKILL_DIR}/scripts/paper_check.py`（`${SKILL_DIR}` 是本文件所在目录）。
**始终在仓库根目录运行**，比对库默认是仓库根目录下的 `paper_library/`（每篇存一个清洗后的 `.txt`）。

## 先讲清楚边界

只和**比对库里的文件**以及**同批上传的文件**比对，不连知网、维普等任何外部数据库。
用户想查自己论文对外的重复率时，直接说明这一点，建议去正规查重平台；不要拿空比对库查出的 0% 当结论。

## 命令

```bash
S="${SKILL_DIR}/scripts/paper_check.py"
python3 "$S" add  文件或文件夹...      # 添加到比对库（同名会更新）
python3 "$S" list                     # 查看比对库
python3 "$S" remove 名称...           # 从比对库删除
python3 "$S" check 文件或文件夹... [--mode vertical|horizontal|both] [-n 13] [--block 学校名 机构名] [--out 目录]
```

- `--mode`：`vertical` 只和比对库比；`horizontal` 只在本批文件之间互相比；默认 `both` 两者都做（比对库为空或只有一个文件时自动跳过对应部分并提醒）。
- `-n`：连续多少个汉字相同算重复，默认 13，推荐 10 到 16。越小越严格。
- `--block`：查重前从文本中删掉的关键词（学校名、机构名等常见套话），比对库和待查文件都会删。
- `--no-strip`：默认会去掉目录之前的封面、摘要、目录以及末尾的参考文献；作业、标书等没有这些结构、或者用户要求全文查重时加上它。
- 支持 PDF、DOCX、TXT（UTF-8 或 GBK）。`.doc` 需要用户先另存为 `.docx`；扫描版 PDF 没有文字层，会提示字数过少。

## 判重规则（向用户解释结果时用）

- 两篇文本**连续 N 个汉字相同**才算重复，标点、空格、英文和数字不参与比对。
- 与某一篇来源的重复字数**少于 30 字**或**低于 0.25%**，不算这篇来源的重复。
- 同一段话在待查文本里出现多次，**只算一次**（报告里第二次出现不标红）。
- 纵向查重时，比对库中与待查文件**同名**的文件自动跳过。

## 流程

1. **加比对库**：用户给出比对文件时用 `add` 入库。入库后问用户要不要提交并推送 `paper_library/`，
   这样比对库能永久保存在仓库里（云端容器是临时的，不提交就会丢）。
2. **查重**：对用户给的待查文件运行 `check`，按需求选 `--mode`、`-n`、`--block`。
3. **交付**：报告在 `reports/check_<时间>/`，每篇一个 `<文件名>.html`（总重复率、各来源、标红全文），
   汇总在 `result.csv`（UTF-8 BOM，Excel 可直接打开）。把 `result.csv` 和相关 HTML 发给用户，
   并用一两句话总结每篇的重复率和最主要来源。

## 测试

```bash
python3 -m unittest discover -s "${SKILL_DIR}/tests"
```

判重规则改编自 [tianlian0/paper_checking_system](https://github.com/tianlian0/paper_checking_system)（GPL-2.0）公开的查重原理，
原项目是 Windows 桌面程序，核心比对为闭源 DLL，这里是独立的 Python 实现。
