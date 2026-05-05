# 发布草稿：我做了一个把 Codex/Claude Markdown 自动同步到飞书云文档的工具

## 标题备选

- 我做了一个把 Codex/Claude 生成的 Markdown 自动同步到飞书云文档的工具
- AI 写 Markdown，团队看飞书：我把中间这一步自动化了
- md2feishu：让 AI 生成的 Markdown 变成有格式的飞书云文档

## 正文草稿

我最近在用 Codex 和 Claude Code 做很多真实工作，包括方案、调研、PRD、架构说明、发布计划。

这些工具很擅长生成 Markdown，但我的日常阅读和协作主要在飞书文档里。于是就出现了一个很烦的流程：

```text
AI 生成 Markdown
我手动导入飞书
AI 修改一版
我再手动导入一版
飞书里出现多个重复文档
```

这个问题不大，但每天重复就很影响工作流。

所以我做了 `md2feishu`。

它的核心思路是：

```text
本地 Markdown + Git = 源文件和历史版本
飞书云文档 = 最新阅读版
md2feishu = 中间的自动同步层
```

同步后飞书里的结构是：

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud documents>
```

例如：

```text
codex/
  md2feishu/
    GitHub 发布与增长方案
  video2obsidian/
    README 营销版草稿
    GitHub 宣传资料套件
```

用法很简单：

```bash
md2feishu setup
md2feishu sync docs/plan.md
```

第一次同步会创建飞书云文档，后续同步会覆盖更新同一篇文档。

重点是：它不是上传 `.md` 文件，也不是附件，而是有格式的飞书云文档。

我还加了一个 Codex skill，让 agent 在生成或更新交付型 Markdown 后知道应该自动运行：

```bash
md2feishu sync <file.md>
```

后续我计划加一个功能：

```bash
md2feishu diff docs/plan.md
```

它会从 Git 里拿两个版本，生成一篇飞书可读的“版本差异说明文档”，这样非工程用户也能看懂每一轮 AI 修改到底改了什么。

这个项目对我来说也是一个 vibe coding 的真实案例：不是为了写 demo 而写 demo，而是从自己每天使用 AI coding 工具的真实痛点出发，把一个小工作流产品化、工具化、开源化。

GitHub：

```text
https://github.com/<your-name>/md2feishu
```

欢迎试用和提建议。

## 短版

我做了一个小工具 `md2feishu`：

- Codex/Claude 生成 Markdown
- 本地 Git 保留版本历史
- 自动同步为有格式的飞书云文档
- 飞书按 `codex/<workspace>/` 自动归档
- 后续计划支持把 Git 差异生成飞书对比文档

适合经常用 AI 写方案、PRD、调研报告、架构文档的人。

GitHub: https://github.com/<your-name>/md2feishu
