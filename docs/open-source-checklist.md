# Open Source Checklist

Before making the repository public:

- Replace `your-name` in `package.json` and `README.md`.
- Decide whether to publish to npm as `md2feishu`.
- Confirm no local state, Feishu tokens, or personal document links are committed.
- Run `npm test`.
- Record a short demo GIF.
- Add screenshots for `codex/<workspace>/` layout.
- Add a launch post draft in Chinese and English.
- Create the GitHub repository and push `main`.

Release v0.1.0 when:

- GitHub install works.
- `md2feishu setup` works for a fresh user.
- `md2feishu sync` creates formatted Feishu cloud docs.
- Skill install instructions are verified.
