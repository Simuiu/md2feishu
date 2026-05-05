# Open Source Checklist

Before making the repository public:

- Replace GitHub repository placeholders. Done for `Simuiu/md2feishu`.
- Decide whether to publish to npm as `md2feishu`.
- Confirm no local state, Feishu tokens, or personal document links are committed. Done in local scan; repeat before push.
- Run `npm test`. Done locally; repeat before push.
- Record a short demo GIF.
- Add screenshots for `codex/<workspace>/` layout.
- Add a launch post draft in Chinese and English. Done.
- Create the GitHub repository and push `main`.

Release v0.1.0 when:

- GitHub install works.
- `md2feishu setup` works for a fresh user.
- `md2feishu sync` creates formatted Feishu cloud docs.
- Skill install instructions are verified.
