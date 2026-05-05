---
name: md2feishu-sync
description: Use when Codex creates or updates a Markdown document intended for user review, delivery, planning, reports, summaries, research notes, specs, PRDs, architecture docs, or other human-readable documents. Sync the Markdown file to the user's Feishu cloud document account using the global md2feishu command.
---

# Markdown To Feishu Sync

Use this skill whenever you create or update a Markdown file that is meant to be read by the user as a document, not just as source code.

## Workflow

After editing the Markdown file, run:

```bash
md2feishu sync <path-to-file.md>
```

Behavior:

- First sync creates a formatted Feishu cloud document in the user's account.
- The tool uses Feishu Docs commands (`docs +create/+update --markdown`), not Drive-native Markdown file commands.
- New cloud documents must be placed under `codex/<workspace-name>/`.
- The only top-level Feishu folder used by this workflow is `codex`.
- Each local workspace gets exactly one direct child folder under `codex`.
- Later syncs for the same local absolute path overwrite the same Feishu document.
- The local Markdown file remains the source of truth.
- Git history in the local workspace remains the version history.
- Feishu is the latest readable view; use Git to inspect, compare, or restore previous Markdown versions.

## Folder Layout

Required Feishu layout:

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud documents>
```

Do not leave synced documents in the Feishu root folder.

Do not create or use `Codex Markdown Sync`.

Do not create nested workspace folders such as `codex/<workspace>/docs/` unless the user explicitly asks.

If folder mappings look stale, run:

```bash
md2feishu workspace refresh
```

## Scope

Sync Markdown files such as:

- reports
- plans
- research notes
- PRDs
- specs
- architecture docs
- summaries
- user-facing deliverables

Do not sync Markdown files that are clearly repo metadata or implementation internals unless the user asks:

- `README.md`
- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `LICENSE.md`
- small inline notes created only for tests

If the user explicitly says not to sync, do not sync.

## Versioning

Use Git for document version history.

Do not create `v1`, `v2`, or `final-final` Markdown copies unless the user explicitly asks.

After a meaningful document revision is complete and synced to Feishu, create a Git commit with a human-readable message.

For small typo fixes, temporary drafts, or incomplete exploration, do not create a separate commit unless the user asks.

When the user asks for an older version, a diff, or a restore, use Git history rather than looking for duplicate Markdown files.

## Auth

If `md2feishu sync` reports missing Feishu/Lark auth, tell the user to run:

```bash
md2feishu setup
```

Then retry the sync after setup succeeds.
