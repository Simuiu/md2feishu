# Security

`md2feishu` stores local state in:

```text
~/.md2feishu/state.json
```

That file may contain:

- local absolute paths
- Feishu folder tokens
- Feishu document tokens or URLs

Do not commit or share it publicly.

Authentication is delegated to the official `@larksuite/cli` package. Follow Feishu/Lark's authorization flow and review the scopes requested during setup.

If you discover a security issue, please open a private report or contact the maintainer before publishing details.
