# Paseo Todo Plugin

A Paseo Explorer panel for the `todo.md` file in each workspace's root.

- Add, edit, complete, and delete Markdown tasks.
- Set optional due dates, including Today, Tomorrow, and One Week shortcuts.
- View active tasks first, ordered by due date, with completed tasks at the bottom.
- Keep file order intact: new tasks append, and edits update their existing lines.
- Refresh external changes and check for conflicts before saving.

```markdown
- [ ] Buy milk 📅 2026-12-01
- [x] Finished task
```

## Install

Requires Paseo 0.15.3 or later, with plugins enabled on the target daemon.

```sh
paseo plugin install git:pfrybar/paseo-todo-plugin
```

Open a workspace, then select **Open Todo list** in the Command Center
(Cmd+K / Ctrl+K), or submit `/todo` in the composer.

## Development

```sh
npm ci
npm run typecheck
npm test
paseo plugin install "$PWD"
```

After editing, run `paseo plugin reload todo-explorer`.

See [OVERVIEW.md](OVERVIEW.md) for file handling and interaction details.
