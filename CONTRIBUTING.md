# Contributing

Thanks for your interest in `md2feishu`.

## Development

```bash
npm install
npm test
node ./bin/md2feishu.js help
```

## Principles

- Markdown remains the local source of truth.
- Feishu shows the latest formatted cloud document.
- Git stores document history.
- The required Feishu layout is `codex/<workspace-name>/<cloud-documents>`.
- Never commit local state, Feishu tokens, or personal document links.

## Pull Requests

Please include:

- a concise description of the workflow or bug
- tests or a manual verification note
- screenshots/GIFs for user-facing behavior when relevant
