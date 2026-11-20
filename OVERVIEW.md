# Todo Explorer

Manage the tasks in `todo.md` at the root of the current workspace from Explorer.

Use **Open Todo list** in the Command Center (Cmd+K / Ctrl+K), or submit `/todo`.
Check tasks off, add or delete tasks, or use the pencil to edit a title and due date.
The editor stays at the top for mobile keyboard visibility.

The file uses ordinary Markdown task lines:

```markdown
- [ ] Buy milk 📅 2026-12-01
- [x] Finish a task
```

Due dates are optional and use YYYY-MM-DD. Today, Tomorrow, and One Week fill in
a date; X clears it. New tasks append to the file. Editing or checking a task
changes its existing line. Other Markdown, whitespace, and line endings are kept.

The panel shows active tasks first, then completed tasks, with each group ordered
by due date. Checking or unchecking pauses briefly before a task moves. Display
sorting does not reorder the file.

Changes save to the workspace's daemon machine, including remote hosts. External
file changes refresh about every two seconds, and the refresh icon reloads them
immediately. Stale saves show a conflict instead of overwriting newer file contents.
If the file does not exist, adding a task creates it. Existing prototype tab tasks
are carried over once only when there is no file; an existing file always wins.
