# md2feishu

[English](README.md) | [中文](README.zh-CN.md)

![md2feishu hero](assets/readme-hero.png)

[![CI](https://github.com/Simuiu/md2feishu/actions/workflows/ci.yml/badge.svg)](https://github.com/Simuiu/md2feishu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933.svg)](package.json)

Turn AI-generated Markdown into organized, formatted Feishu cloud docs.

`md2feishu` is for people who use Codex, Claude Code, Cursor, Gemini CLI, or other AI coding agents to write plans, reports, PRDs, architecture notes, and research docs as Markdown, but prefer to read and share the final result in Feishu/Lark.

AI agents are great at writing Markdown. Teams often read and collaborate in Feishu.

`md2feishu` bridges that gap: keep Markdown as the local source of truth, keep Git as the version history, and publish the latest readable version to Feishu as a real cloud document.

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud docs>
```

## What It Solves

Without this workflow, every AI revision usually creates manual work:

```text
agent writes .md -> manually import to Feishu -> revise -> import again -> duplicate docs
```

With `md2feishu`:

```text
agent writes .md -> md2feishu sync -> Feishu shows the latest cloud doc
```

- No duplicate imports after each AI revision.
- No `.md` attachments pretending to be docs.
- One simple Feishu layout: `codex/<workspace-name>/<cloud docs>`.
- Git keeps previous versions and diffs.
- Feishu stays the clean, readable latest version.

## Demo

```bash
$ md2feishu sync docs/launch-plan.md

Created Feishu document
  file: /Users/me/project/docs/launch-plan.md
  title: Launch Plan
  doc: https://www.feishu.cn/docx/...
```

Feishu layout:

```text
codex/
  project/
    Launch Plan
```

Run it again after editing the same Markdown file:

```bash
$ md2feishu sync docs/launch-plan.md

Updated existing Feishu document
  file: /Users/me/project/docs/launch-plan.md
  title: Launch Plan
```

No duplicate imports. No `.md` attachments. The same Feishu cloud document now shows the latest version.

## Why

AI agents write Markdown. Teams read Feishu docs.

- Local `.md` files stay versioned in Git.
- Feishu always shows the latest formatted cloud document.
- Documents are grouped by local workspace under `codex/<workspace-name>/`.
- Agent skills can trigger sync automatically after meaningful document updates.
- Future diff docs can turn Git version changes into Feishu-readable comparison documents.

## What Makes It Different

Most Markdown tools focus on conversion.

`md2feishu` focuses on the whole agent workflow:

- **Source of truth**: local Markdown + Git.
- **Reading surface**: formatted Feishu cloud docs.
- **Organization**: one `codex` root folder, one folder per local workspace.
- **Agent-aware**: ships with a Codex skill so agents know when to sync.
- **Version-aware roadmap**: planned `md2feishu diff` generates readable Feishu docs explaining what changed between Git versions.

## Quick Start

```bash
npm install -g github:Simuiu/md2feishu
md2feishu setup
md2feishu sync docs/plan.md
```

During setup, follow the Feishu/Lark authorization URL printed by the official `lark-cli`.

The npm package name is reserved for a future release. Until then, install from GitHub.

## Feishu Output

`md2feishu` creates formatted Feishu cloud documents through Feishu Docs APIs.

It does **not** upload Markdown files as attachments.

Expected layout:

```text
codex/
  trading-agent/
    Market Research Plan
    Architecture Review
  product-specs/
    v2 Product Proposal
```

The top-level folder is always `codex` by default. Each local workspace gets one direct child folder.

## Commands

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

### Typical Workflow

```bash
# 1. Create or revise a Markdown document with your agent.
$ codex "write a launch strategy in docs/launch-plan.md"

# 2. Publish the latest readable version to Feishu.
$ md2feishu sync docs/launch-plan.md

# 3. Save the local source version in Git when the revision is meaningful.
$ git add docs/launch-plan.md
$ git commit -m "docs: add launch strategy"
```

## Agent Skill

This repository includes a Codex-compatible skill:

```text
skills/md2feishu-sync/SKILL.md
```

Manual install:

```bash
mkdir -p ~/.codex/skills/md2feishu-sync/md2feishu-sync
cp skills/md2feishu-sync/SKILL.md ~/.codex/skills/md2feishu-sync/md2feishu-sync/SKILL.md
```

The skill tells Codex when to run:

```bash
md2feishu sync <path-to-file.md>
```

Skill behavior:

- Sync reports, plans, PRDs, specs, research notes, and architecture docs.
- Skip repo metadata like `README.md` and `CHANGELOG.md` unless explicitly requested.
- Keep Feishu as the latest readable view.
- Use Git for previous versions, diffs, and restores.

## Versioning

Feishu is the latest readable view.

Git is the version history.

Do not create `v1`, `v2`, or `final-final` Markdown copies unless you explicitly want file-based snapshots. Use Git to inspect, compare, or restore earlier versions.

Planned:

```bash
md2feishu diff docs/launch-plan.md
```

This will create a Feishu-readable comparison document from Git history, so non-engineering readers can see what changed between revisions without reading raw `git diff`.

## What It Does Not Do

- It does not upload Markdown as a `.md` attachment.
- It does not create Drive-native Markdown files.
- It does not use Feishu as the source of truth.
- It does not replace Git.

## State

Local bindings are stored in:

```text
~/.md2feishu/state.json
```

Do not commit this file. It may contain local paths and Feishu document/folder tokens.

## Roadmap

- `md2feishu inspect <file.md>` for dry workspace/folder resolution.
- `md2feishu diff <file.md>` to publish Git version differences as Feishu-readable comparison docs.
- Better markdown block handling for tables, images, and diagrams.
- npm release and packaged skill installation.

## Project Status

Early preview. The workflow is already usable, but the package is being prepared for a public GitHub and npm release.

## License

MIT
