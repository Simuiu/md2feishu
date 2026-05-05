# Launch Draft: md2feishu

## Title Options

- I built a tool that turns AI-generated Markdown into Feishu cloud docs
- AI agents write Markdown. My team reads Feishu. I automated the bridge.
- md2feishu: publish Codex/Claude Markdown as organized Feishu docs

## Draft

I use Codex and Claude Code to produce real work: plans, research notes, PRDs, architecture docs, and launch strategies.

The agents are great at Markdown. My reading and collaboration workflow is in Feishu.

The annoying loop looked like this:

```text
agent writes Markdown
I manually import it to Feishu
agent revises it
I import it again
Feishu gets duplicate docs
```

So I built `md2feishu`.

The model is simple:

```text
local Markdown + Git = source and history
Feishu cloud docs = latest readable view
md2feishu = sync layer
```

Feishu output is organized like this:

```text
codex/
  <workspace-name>/
    <formatted Feishu cloud docs>
```

Usage:

```bash
md2feishu setup
md2feishu sync docs/plan.md
```

The first sync creates a formatted Feishu cloud document. Later syncs update the same document.

It does not upload `.md` files as attachments. It creates real Feishu docs.

The repo also ships with a Codex skill, so agents can learn when to run:

```bash
md2feishu sync <file.md>
```

Next, I want to add:

```bash
md2feishu diff docs/plan.md
```

That will turn Git version differences into Feishu-readable comparison docs, so non-engineering readers can understand what changed between AI-generated revisions.

GitHub:

```text
https://github.com/<your-name>/md2feishu
```
