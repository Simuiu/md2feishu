# md2feishu

[English](README.md) | [中文](README.zh-CN.md)

![md2feishu hero](assets/readme-hero.png)

[![CI](https://github.com/Simuiu/md2feishu/actions/workflows/ci.yml/badge.svg)](https://github.com/Simuiu/md2feishu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

把 AI 生成的 Markdown 同步成有格式的飞书云文档，并按本地工作区自动归档。

`md2feishu` 适合经常用 Codex、Claude Code、Cursor、Gemini CLI 或其他 AI 编程工具写方案、报告、PRD、架构说明、调研材料的人。你可以继续把 Markdown 和 Git 作为本地源文件与版本历史，同时把最新版发布成真正的飞书/Lark 云文档，方便阅读和分享。

AI agent 很擅长写 Markdown，但团队协作和阅读通常发生在飞书文档里。

`md2feishu` 解决的就是这两个世界之间的断点：本地 Markdown 是源文件，Git 是版本历史，飞书展示最新版的可读云文档。

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud docs>
```

## 解决什么问题

没有这个流程时，每次 AI 修改文档都要手动处理：

```text
agent 写 .md -> 手动导入飞书 -> 再修改 -> 再导入 -> 产生重复文档
```

有了 `md2feishu`：

```text
agent 写 .md -> md2feishu sync -> 飞书显示最新版云文档
```

- 每次 AI 修改后，不需要重复导入。
- 飞书里不是 `.md` 附件，而是有格式的云文档。
- 统一目录结构：`codex/<workspace-name>/<cloud docs>`。
- Git 保存历史版本和差异。
- 飞书只负责展示干净、可读的最新版。

## 演示

```bash
$ md2feishu sync docs/launch-plan.md

Created Feishu document
  file: /Users/me/project/docs/launch-plan.md
  title: Launch Plan
  doc: https://www.feishu.cn/docx/...
```

飞书目录结构：

```text
codex/
  project/
    Launch Plan
```

修改同一个 Markdown 文件后再次执行：

```bash
$ md2feishu sync docs/launch-plan.md

Updated existing Feishu document
  file: /Users/me/project/docs/launch-plan.md
  title: Launch Plan
```

不会产生重复导入。不会上传 `.md` 附件。同一个飞书云文档会显示最新版。

## 为什么需要它

AI agent 写 Markdown。团队读飞书文档。

- 本地 `.md` 文件继续由 Git 管理版本。
- 飞书永远展示最新版格式化云文档。
- 文档按本地工作区归档到 `codex/<workspace-name>/`。
- Codex skill 可以在重要文档更新后自动触发同步。
- 后续 `md2feishu diff` 会把 Git 版本差异生成适合非工程读者看的飞书对比文档。

## 有什么不同

大多数 Markdown 工具只关注“格式转换”。

`md2feishu` 关注的是完整的 AI 文档工作流：

- **源文件**：本地 Markdown + Git。
- **阅读面**：飞书格式化云文档。
- **目录管理**：一个 `codex` 根目录，每个本地工作区一个子目录。
- **Agent 友好**：内置 Codex skill，让 agent 知道什么时候该同步。
- **版本路线图**：计划中的 `md2feishu diff` 会把 Git 版本变化变成飞书可读的变更说明。

## 快速开始

```bash
npm install -g github:Simuiu/md2feishu
md2feishu setup
md2feishu sync docs/plan.md
```

初始化时，根据官方 `lark-cli` 打印的飞书/Lark 授权链接完成授权。

npm 包名会留到后续正式发布。当前阶段先通过 GitHub 安装。

## 飞书输出

`md2feishu` 通过飞书 Docs API 创建格式化云文档。

它不会把 Markdown 当成附件上传。

期望目录结构：

```text
codex/
  trading-agent/
    Market Research Plan
    Architecture Review
  product-specs/
    v2 Product Proposal
```

默认顶层文件夹永远是 `codex`。每个本地工作区对应一个直接子文件夹。

## 命令

```bash
md2feishu setup
md2feishu sync <file.md>
md2feishu watch <file.md>
md2feishu status
md2feishu links
md2feishu doctor
md2feishu workspace status
md2feishu workspace refresh
md2feishu workspace bind <workspace-path> <folder-token>
```

### 典型流程

```bash
# 1. 让 agent 创建或修改 Markdown 文档
$ codex "write a launch strategy in docs/launch-plan.md"

# 2. 发布最新版到飞书
$ md2feishu sync docs/launch-plan.md

# 3. 重要版本用 Git 保存
$ git add docs/launch-plan.md
$ git commit -m "docs: add launch strategy"
```

## Agent Skill

仓库内包含一个 Codex 兼容 skill：

```text
skills/md2feishu-sync/SKILL.md
```

手动安装：

```bash
mkdir -p ~/.codex/skills/md2feishu-sync/md2feishu-sync
cp skills/md2feishu-sync/SKILL.md ~/.codex/skills/md2feishu-sync/md2feishu-sync/SKILL.md
```

这个 skill 会告诉 Codex 在合适时机执行：

```bash
md2feishu sync <path-to-file.md>
```

Skill 行为：

- 同步报告、方案、PRD、规格说明、调研笔记和架构文档。
- 默认跳过 `README.md`、`CHANGELOG.md` 这类仓库元数据，除非用户明确要求。
- 飞书展示最新版。
- 旧版本、对比和恢复都交给 Git。

## 版本管理

飞书是最新版阅读面。

Git 是版本历史。

除非你明确想要文件快照，否则不建议创建 `v1`、`v2`、`final-final` 这类重复 Markdown 文件。查看、对比或恢复旧版本时，用 Git。

计划支持：

```bash
md2feishu diff docs/launch-plan.md
```

它会根据 Git 历史生成飞书可读的版本对比文档，让非工程读者不用读原始 `git diff` 也能理解改了什么。

## 不做什么

- 不上传 Markdown 作为 `.md` 附件。
- 不创建 Drive 原生 Markdown 文件。
- 不把飞书作为源文件。
- 不替代 Git。

## 状态文件

本地绑定关系保存在：

```text
~/.md2feishu/state.json
```

不要提交这个文件。它可能包含本地路径和飞书文档/文件夹 token。

## 路线图

- `md2feishu inspect <file.md>`：预览工作区和飞书文件夹解析结果。
- `md2feishu diff <file.md>`：把 Git 版本差异发布成飞书可读的对比文档。
- 更好的 Markdown block 支持，包括表格、图片和图表。
- npm 发布和 skill 安装打包。

## 项目状态

早期预览版。核心工作流已经可用，项目正在准备公开 GitHub 和 npm 发布。

## License

MIT
