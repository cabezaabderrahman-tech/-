# 怎么使用这些 Skills

## 1. Word 论文

提示词：

使用 docx skill 修改这个 Word。保留原来的字体、字号、标题层级、页眉页脚、参考文献排版，只修改正文内容。修改前先检查文档结构，完成后检查格式是否发生变化。

## 2. PDF / 财报 / 行业报告

使用 pdf skill 读取这个 PDF。先定位与问题相关的页，不要无差别全文读取；提取关键数据时记录页码和出处。

## 3. 文献综述

先使用 literature-review，再使用 research 核验关键事实。不得虚构作者、期刊、DOI、年份或研究结论；无法确认的信息必须标记为未核实。

## 4. PPT

使用 pptx skill 创建/修改 PPT。先确定叙事结构，再制作页面。图表数据必须保留来源。

## 5. Excel / 数据分析

使用 xlsx skill。优先使用公式或脚本计算，不要手算大量数据；所有关键结果做交叉校验。

## 6. 网站 / Claude Artifact

使用 frontend-design + web-artifacts-builder。先做最小可运行版本，再增加动画和复杂功能。

## 7. 网页 Bug

使用 webapp-testing 实际运行和测试网页。最多自动修复 2 轮；仍有问题时停止循环，输出剩余问题清单。

## 8. 最近趋势

使用 last30days 查询最近30天的 GitHub / Reddit / Hacker News 等讨论，并区分“社区热度”和“事实”。

## 9. 复杂研究

使用 research。优先：官方数据 > 企业年报/公告 > 权威学术来源 > 高质量媒体 > 社区讨论。

## 10. 创建自己的 Skill

使用 skill-creator 创建一个名为 liping-academic-research 的 Skill，要求：
- 关键数据必须有来源
- 禁止编造参考文献
- 优先政府统计局、企业年报、正式论文
- Word 修改保持原格式
- 默认控制 Token 消耗
- 任务结束生成简短项目摘要
