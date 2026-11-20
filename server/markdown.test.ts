import assert from "node:assert/strict";
import { test } from "node:test";
import { applyMarkdownChange, parseMarkdown } from "./markdown";
import { sortTasks } from "../shared/todos";

test("reads checkboxes, Markdown text, and valid trailing dates", () => {
  const tasks = parseMarkdown("# Todo\n\n- [ ] **Buy milk** 📅 2026-12-01\n* [X] Done\n  - [ ] Nested\n- [ ] Invalid 📅 2026-02-30\n");
  assert.deepEqual(tasks, [
    { id: 3, title: "**Buy milk**", dueDate: "2026-12-01", done: false },
    { id: 4, title: "Done", dueDate: null, done: true },
    { id: 5, title: "Nested", dueDate: null, done: false },
    { id: 6, title: "Invalid 📅 2026-02-30", dueDate: null, done: false },
  ]);
});

test("does not interpret Markdown examples inside fenced code blocks", () => {
  assert.deepEqual(parseMarkdown("```md\n- [ ] Example\n```\n- [ ] Real task\n").map((task) => task.title), ["Real task"]);
});

test("toggling changes only the checkbox and keeps other bytes and CRLF", () => {
  const text = "# Todo\r\n\r\n  * [ ] Keep **formatting** 📅 2026-12-01  \r\n- [x] Second\r\n";
  const checked = applyMarkdownChange(text, { kind: "setDone", id: 3, done: true });
  assert.equal(checked, text.replace("* [ ]", "* [x]"));
  assert.equal(applyMarkdownChange(checked, { kind: "setDone", id: 3, done: false }), text);
});

test("edits and clears trailing due dates in place without sorting", () => {
  const text = "- [x] First 📅 2026-12-01\n- [ ] Second 📅 2026-11-01\n";
  const edited = applyMarkdownChange(text, { kind: "edit", id: 1, title: "Changed", dueDate: "2026-12-02" });
  assert.equal(edited, "- [x] Changed 📅 2026-12-02\n- [ ] Second 📅 2026-11-01\n");
  assert.equal(applyMarkdownChange(edited, { kind: "edit", id: 1, title: "Changed", dueDate: null }), "- [x] Changed\n- [ ] Second 📅 2026-11-01\n");
});

test("new tasks append and handle missing final newline and CRLF", () => {
  const change = { kind: "add", title: "New", dueDate: "2026-11-20" } as const;
  assert.equal(applyMarkdownChange("", change), "- [ ] New 📅 2026-11-20\n");
  assert.equal(applyMarkdownChange("- [ ] Old", change), "- [ ] Old\n- [ ] New 📅 2026-11-20\n");
  assert.equal(applyMarkdownChange("- [ ] Old\r\n", change), "- [ ] Old\r\n- [ ] New 📅 2026-11-20\r\n");
});

test("deletes only the selected line, even with duplicate titles", () => {
  assert.equal(applyMarkdownChange("# Todo\n- [ ] Same\n- [ ] Same\n", { kind: "delete", id: 2 }), "# Todo\n- [ ] Same\n");
  assert.throws(() => applyMarkdownChange("# Todo\n", { kind: "delete", id: 1 }), /no longer exists/);
});

test("display sorting leaves file order alone and honors delayed completion", () => {
  const text = "- [x] Done 📅 2026-11-01\n- [ ] Undated\n- [ ] Later 📅 2026-12-01\n- [ ] Earlier 📅 2026-11-20\n";
  const tasks = parseMarkdown(text);
  assert.deepEqual(sortTasks(tasks).map((task) => task.id), [4, 3, 2, 1]);
  const toggled = tasks.map((task) => task.id === 4 ? { ...task, done: true } : task);
  assert.deepEqual(sortTasks(toggled, new Map([[4, false]])).map((task) => task.id), [4, 3, 2, 1]);
  assert.deepEqual(sortTasks(toggled).map((task) => task.id), [3, 2, 1, 4]);
  assert.deepEqual(tasks.map((task) => task.id), [1, 2, 3, 4]);
});
