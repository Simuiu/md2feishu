# md2feishu GitHub 发布与增长方案

## 1. 项目定位

`md2feishu` 不应该被包装成一个普通的 Markdown 转换脚本，而应该定位成：

> A global Codex/Claude workflow that turns local AI-generated Markdown into organized, formatted Feishu cloud documents.

中文表达：

> 让 Codex / Claude 在任意本地工作区生成的 Markdown，自动同步为飞书云文档，并按 `codex/<工作区名>/` 管理。

这个定位有三个优势：

- 痛点清晰：AI coding 产出的文档多，但团队阅读和版本同步麻烦。
- 场景新：把 Agent Skill、CLI、飞书云文档、工作区目录管理串成完整工作流。
- 求职展示强：不是玩具项目，而是从真实工作流痛点出发，经过调研、实现、测试、清理和产品化沉淀。

## 2. 目标用户与核心卖点

目标用户：

- 高频使用 Codex / Claude Code / Cursor / Gemini CLI 的开发者
- 经常让 AI 生成 PRD、方案、调研报告、架构文档的人
- 使用飞书作为团队知识库或协作文档系统的中国开发者和团队
- 想沉淀个人 AI workflow / vibe coding 案例的人

核心卖点：

- Markdown 仍然是本地源文件，Git 保留版本历史。
- 飞书展示始终是最新版、有格式的云文档，不是 `.md` 附件。
- 任意工作区自动归档到 `codex/<workspace>/`。
- Codex / Claude 可通过 Skill 自动触发同步。
- 可以把 Git 中两个版本的差异生成一篇飞书云文档，让用户在在线文档里读懂“这一版改了什么”。
- 一条命令完成首次创建和后续覆盖更新：

```bash
md2feishu sync docs/plan.md
```

## 3. GitHub 仓库形态

建议仓库名：

```text
md2feishu
```

备选：

```text
codex-feishu-sync
agent-md-to-feishu
markdown-to-feishu-docs
```

推荐目录结构：

```text
md2feishu/
  README.md
  LICENSE
  package.json
  package-lock.json
  bin/
    md2feishu.js
  skills/
    md2feishu-sync/
      SKILL.md
  examples/
    basic-report.md
    codex-workflow.md
  docs/
    architecture.md
    launch-story.md
    troubleshooting.md
  .github/
    workflows/
      ci.yml
    ISSUE_TEMPLATE/
      bug_report.yml
      feature_request.yml
  state.example.json
  SECURITY.md
  CONTRIBUTING.md
```

不要上传：

- 真实 `state/map.json`
- 飞书 token、folder token、doc token
- 本机路径映射
- `node_modules`
- 任何个人飞书文档链接

## 4. 程序端需要补齐的能力

### 4.1 安装体验

目标是让用户能这样安装：

```bash
npm install -g md2feishu
md2feishu setup
md2feishu sync docs/example.md
```

短期可以先支持 GitHub 安装：

```bash
npm install -g github:Simiui/md2feishu
```

中期再发布到 npm：

```bash
npm install -g md2feishu
```

需要改动：

- `package.json` 去掉 `private: true`
- 包名改成可发布名称，例如 `md2feishu`
- 明确 `bin.md2feishu`
- 增加 `files` 字段，只发布必要文件
- 增加 `engines.node >=20`
- 增加 `repository`、`bugs`、`homepage`、`keywords`

### 4.2 状态文件从仓库剥离

当前状态在：

```text
~/.codex/tools/md2feishu/state/map.json
```

开源版应改成：

```text
~/.md2feishu/state.json
```

或：

```text
~/.config/md2feishu/state.json
```

建议使用 `~/.md2feishu/state.json`，对普通用户更直观。

状态初始化规则：

- 首次运行自动创建状态目录
- 默认根目录名为 `codex`
- 状态文件不存在时创建空模板
- 绝不把状态文件放在项目仓库里

### 4.3 最终同步规则固化

必须在代码、README、Skill 中统一：

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud documents>
```

规则：

- 只使用顶层 `codex`
- 每个本地工作区对应一个直接子文件夹
- 不创建 `codex/<workspace>/docs/`
- 不把同步文档留在飞书根目录
- Markdown 必须转成有格式飞书云文档
- 不使用 Drive-native Markdown 文件

### 4.4 命令设计

保留核心命令：

```bash
md2feishu setup
md2feishu sync <file.md>
md2feishu watch <file.md>
md2feishu status
md2feishu links
md2feishu doctor
```

保留管理命令：

```bash
md2feishu workspace status
md2feishu workspace refresh
md2feishu workspace bind <workspace-path> <folder-token>
md2feishu init --root-folder-name codex
```

新增建议：

```bash
md2feishu inspect <file.md>
```

用途：显示这个文件会同步到哪个工作区、哪个飞书文件夹、是否已有绑定，不产生写操作。

新增重点能力：

```bash
md2feishu diff <file.md>
```

默认比较当前文件和上一个 Git commit 中的版本，生成一篇面向用户阅读的差异说明 Markdown，并同步为飞书云文档。

支持扩展参数：

```bash
md2feishu diff <file.md> --from <commit> --to <commit>
md2feishu diff <file.md> --from HEAD~3 --to HEAD
md2feishu diff <file.md> --title "对比 - v1 到 v2"
```

差异文档建议放在：

```text
codex/
  <workspace-name>/
    <latest formatted cloud documents>
    diffs/
      对比 - <doc-title> - <from> 到 <to>
```

差异文档内容不应只是原始 `git diff`，而应该是适合非工程用户阅读的在线文档：

```text
# 对比 - GitHub 发布方案 - 上一版到当前版

## 总结

- 本轮主要补充了 GitHub 发布策略。
- 强化了求职案例叙事。
- 调整了 README 首屏定位。

## 新增内容

...

## 删除内容

...

## 修改内容

旧版：
...

新版：
...
```

实现方式：

- 用 Git 取出两个版本的 Markdown。
- 用结构化 diff 得到新增、删除、修改片段。
- 生成一份新的 Markdown 差异说明。
- 使用 `md2feishu sync` 同步成飞书云文档。
- 默认不覆盖正式文档，只新增或更新对应的 diff 文档。

这个能力是项目的重要差异化点：AI 生成的文档不是用户亲手写的，用户尤其需要知道每轮修改到底发生了什么。

### 4.5 错误处理与安全

需要补齐：

- 缺少飞书授权时，直接提示 `md2feishu setup`
- 缺少额外权限时，提示具体 scope
- 同步失败时不写入错误绑定
- folder/doc token 不应在默认日志中过度暴露，可在 `--verbose` 时显示
- 对删除命令保持克制，不做面向用户的批量删除能力

### 4.6 测试与 CI

GitHub 上至少要有：

- `npm test`
- `npm run lint` 或 `node --check`
- GitHub Actions CI

测试层级：

- 单元测试：路径解析、标题提取、状态读写、工作区识别
- dry-run 测试：确认调用的是 `docs +create/+update --markdown`
- mock CLI 测试：模拟 `lark-cli` 输出，验证绑定和覆盖更新
- 手动集成测试文档：说明真实飞书测试步骤，不把 token 写入仓库

### 4.7 Skill 打包

仓库内提供：

```text
skills/md2feishu-sync/SKILL.md
```

Skill 说明要强调：

- 何时触发：创建或更新交付型 Markdown
- 何时不触发：README、CHANGELOG、LICENSE 等仓库元文档，除非用户明确要求
- 必须运行：`md2feishu sync <file.md>`
- 必须保证：飞书结构是 `codex/<workspace>/<cloud docs>`

安装方式先写手动：

```bash
mkdir -p ~/.codex/skills/md2feishu-sync
cp -R skills/md2feishu-sync ~/.codex/skills/md2feishu-sync/
```

后续再适配 `npx skills add`、`gh skill install` 或其他 agent skill 安装器。

## 5. README 应该怎么写

README 的目标不是“解释所有细节”，而是让陌生人 30 秒内知道：

- 我为什么需要它
- 它和普通 Markdown 上传有什么区别
- 怎么安装
- 怎么跑第一条命令
- 最终飞书里长什么样

推荐 README 结构：

```text
# md2feishu

One sentence pitch

## The Problem
AI agents write Markdown. Teams read Feishu docs.

## What It Does
local .md -> formatted Feishu cloud doc
codex/<workspace>/<doc>

## Demo
GIF or screenshots

## Quick Start
npm install -g ...
md2feishu setup
md2feishu sync docs/plan.md

## Agent Skill
How Codex / Claude uses it automatically

## Commands

## How It Works

## Security

## Roadmap
```

首屏文案建议：

> Turn AI-generated Markdown into organized Feishu cloud docs.
>
> `md2feishu` keeps Markdown as your local source of truth, while automatically publishing formatted Feishu documents under `codex/<workspace>/`.

中文副标题：

> 让 Codex / Claude 生成的 Markdown 自动进入飞书云文档，而不是反复手动导入。

## 6. 视觉与 Demo 素材

GitHub 上想拿 star，必须有可视化证据。

建议准备：

- 一张架构图：`Codex/Claude -> Markdown -> md2feishu -> Feishu cloud doc`
- 一张飞书目录截图：`codex/video2obsidian/三篇文档`
- 一段终端 GIF：
  - `md2feishu sync docs/plan.md`
  - 输出飞书链接
  - 浏览器打开有格式云文档
- 一张 before/after：
  - Before：一堆 `.md` 文件，本地难读、手动导入
  - After：飞书里按工作区归档

演示故事不要太技术化，应该讲真实工作流：

> I use Codex to produce plans, reports, and specs. Markdown is great for agents, but bad for daily reading in Feishu. So I built a bridge: local Markdown remains versioned in Git; Feishu always shows the latest formatted doc.

## 7. 社区传播策略

### 7.1 首发渠道

优先级：

1. GitHub README + Release
2. X / Twitter 中文和英文各一条
3. 即刻 / 掘金 / V2EX / 少数派社区
4. Reddit：`r/ClaudeAI`、`r/ClaudeCode`、`r/vibecoding`、`r/SideProject`
5. Hacker News：只有 README、demo、安装体验稳定后再上
6. Awesome lists：提交到 Claude Code / Agent Skills 相关 awesome 仓库

调研依据：

- Anthropic 官方 skills 仓库把 Skill 定义为包含 `SKILL.md` 的自包含目录，适合作为社区可复用单元。
- `larksuite/cli` 已经支持 Agent Skills 和 Feishu/Lark API CLI，用官方 CLI 做底层更可信。
- 多个 awesome/skill 目录已经在收录 agent skills，说明这个生态正在形成分发入口。
- Hacker News 对 AI/LLM 工具有明显启动效应，但需要完整 demo 和稳定安装体验再发布。

### 7.2 发布节奏

第 0 阶段：私有打磨

- 完成 README
- 完成 demo GIF
- 完成最小 CI
- 写清楚安全边界

第 1 阶段：GitHub soft launch

- 公开仓库
- 发一条中文朋友圈/即刻/微信群
- 收集 3-5 个真实用户反馈

第 2 阶段：开发者社区

- 发 V2EX / 掘金文章
- 主题：`我把 Codex 生成的 Markdown 自动同步成飞书云文档`
- 强调真实痛点和最终目录结构

第 3 阶段：国际化

- README 英文优先，中文补充
- 发 Reddit / X
- 提交 awesome agent skills / Claude Code skills 目录

第 4 阶段：Hacker News / Product Hunt

- 有 npm 安装
- 有 GIF
- 有 3 个以上真实用户案例
- 有明确 Roadmap

## 8. 求职叙事包装

这可以包装成一个非常好的 vibe coding 案例，但重点不是“我让 AI 写了个脚本”，而是：

> 我识别了 AI coding 工作流中的知识交付断点，并把它产品化成可复用的 agent workflow。

面试叙事结构：

1. 场景：Codex / Claude 产出大量 Markdown，但团队阅读在飞书。
2. 痛点：每次修改都要重新导入，版本和阅读链路割裂。
3. 方案：CLI + Agent Skill + Feishu Docs API。
4. 设计：本地 Markdown/Git 是 source of truth，飞书是阅读视图。
5. 产品化：按 `codex/<workspace>/` 自动归档。
6. 工程化：权限、状态映射、覆盖更新、清理测试、CI、文档。
7. 增长：开源发布、demo、社区反馈。

简历 bullet 示例：

```text
Built md2feishu, an agent workflow + CLI that turns AI-generated Markdown from Codex/Claude into formatted Feishu cloud documents, preserving local Git history while publishing organized docs under codex/<workspace>/.
```

中文版本：

```text
设计并实现 md2feishu：一个面向 Codex/Claude 工作流的 CLI + Agent Skill，将 AI 生成的 Markdown 自动同步为有格式的飞书云文档，并按工作区归档，解决文档交付和版本同步问题。
```

## 9. 风险与差异化

风险：

- 飞书 API 权限复杂，用户首次配置可能卡住。
- 海外用户不用飞书，国际传播面相对窄。
- Agent Skill 标准仍在快速变化。
- `lark-cli docs +create/+update` 当前提示 v1 API deprecated，需要关注后续升级。

差异化策略：

- 不做泛用 Markdown 转换器，专注 AI-generated Markdown workflow。
- 不只提供 CLI，还提供 Skill，让 agent 自动使用。
- 不只同步文档，还解决工作区归档。
- 不只展示最新版，还能把 Git 版本差异转换成适合在飞书阅读的对比文档。
- 不把飞书当文件盘，而是明确生成可阅读的云文档。
- 用真实个人工作流作为 story，比抽象工具更容易传播。

## 10. 实施路线

### Milestone 1：开源前整理

- 把当前全局工具迁移到仓库源码。
- 移除所有本机状态和 token。
- 调整 `package.json` 为可发布包。
- 增加 `state.example.json`。
- 增加 `README.md`、`SECURITY.md`、`CONTRIBUTING.md`。
- 增加 `skills/md2feishu-sync/SKILL.md`。

### Milestone 2：工程质量

- 增加基础测试。
- 增加 GitHub Actions。
- 增加 `md2feishu inspect`。
- 增加 `md2feishu diff`，支持把 Git 版本差异生成飞书对比文档。
- 增强错误提示。
- 确认缺权限时提示具体 scope。

### Milestone 3：Demo 与内容

- 录制终端同步 GIF。
- 截图飞书目录结构。
- 截图飞书中的版本差异对比文档。
- 写 `docs/launch-story.md`。
- 写中文介绍文章。
- 写英文 launch post。

### Milestone 4：发布

- GitHub public repo。
- 打 v0.1.0 release。
- 发布 npm 包。
- 提交 awesome lists。
- 社区发帖。

## 11. 参考资料

- Anthropic Skills repository: https://github.com/anthropics/skills
- Vercel Labs skills CLI: https://github.com/vercel-labs/skills
- Lark/Feishu official CLI: https://github.com/larksuite/cli
- Awesome Claude Code: https://github.com/subinium/awesome-claude-code
- Awesome Claude Skills directory: https://awesomeclaudeskills.com/
- GitHub CLI skill install manual: https://cli.github.com/manual/gh_skill_install
- Linux Foundation GitHub open source practices: https://www.linuxfoundation.org/research/recommended-practices-for-hosting-and-managing-open-source-projects-on-github
- Launch-Day Diffusion paper on Hacker News impact: https://arxiv.org/abs/2511.04453
- GitHub stars research: https://arxiv.org/abs/1811.07643
