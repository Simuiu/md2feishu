# md2feishu

Turn AI-generated Markdown into organized, formatted Feishu cloud documents.

`md2feishu` keeps Markdown as your local source of truth while publishing the latest readable version to Feishu under:

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud documents>
```

It is designed for Codex, Claude Code, and other agent workflows that produce plans, reports, PRDs, architecture docs, and research notes as Markdown.

## Why

AI agents write Markdown. Teams read Feishu docs.

Manual import is slow, and repeated imports create duplicate documents. `md2feishu` gives you a stable workflow:

- Local `.md` files stay versioned in Git.
- Feishu always shows the latest formatted cloud document.
- Documents are grouped by local workspace.
- Agent skills can trigger sync automatically after meaningful document updates.

## Quick Start

```bash
npm install -g github:your-name/md2feishu
md2feishu setup
md2feishu sync docs/plan.md
```

During setup, follow the Feishu/Lark authorization URL printed by the official `lark-cli`.

The npm package name is reserved for a future release. Until then, install from GitHub.

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

## Versioning

Feishu is the latest readable view.

Git is the version history.

Do not create `v1`, `v2`, or `final-final` Markdown copies unless you explicitly want file-based snapshots. Use Git to inspect, compare, or restore earlier versions.

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

## License

MIT
