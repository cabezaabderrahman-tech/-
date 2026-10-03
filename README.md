# PPT 工作区

本仓库内置了 [ppt-master](https://github.com/hugohe3/ppt-master)（v6.6.0，上游提交 `44c10ed0`），
作为 Claude Code 项目技能放在 `.claude/skills/ppt-master/`。

- 在这个仓库里打开 Claude Code，直接说"用这份材料做一份 PPT"即可触发该技能。
- 云端会话启动时，`.claude/hooks/session-start.sh` 会自动安装 Python 依赖。
- 本地使用需先执行一次：`pip install -r .claude/skills/ppt-master/requirements.txt`

## 更新 ppt-master

```bash
git clone --depth 1 https://github.com/hugohe3/ppt-master.git /tmp/ppt-master
rm -rf .claude/skills/ppt-master
cp -r /tmp/ppt-master/skills/ppt-master .claude/skills/ppt-master
```
