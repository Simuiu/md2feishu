# Demo Script

Use this script to record the first public GIF/video demo.

## Scene 1: Problem

Show a local workspace with a Markdown report:

```bash
tree docs
sed -n '1,80p' docs/launch-plan.md
```

Narration:

> Codex and Claude are great at generating Markdown, but my team reads Feishu docs.

## Scene 2: Sync

Run:

```bash
md2feishu sync docs/launch-plan.md
```

Show output:

```text
Created Feishu document
```

## Scene 3: Feishu Layout

Open Feishu and show:

```text
codex/
  <workspace-name>/
    Launch Plan
```

Narration:

> The Markdown became a formatted Feishu cloud document, not a Markdown upload.

## Scene 4: Update

Edit the Markdown, then run:

```bash
md2feishu sync docs/launch-plan.md
```

Show:

```text
Updated existing Feishu document
```

Narration:

> No duplicate imports. The same Feishu document now shows the latest version.

## Scene 5: Versioning

Show:

```bash
git log --oneline -- docs/launch-plan.md
```

Narration:

> Feishu is the latest readable view. Git keeps the source history.
