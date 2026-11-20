import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { TodoFiles } from "./files";

async function fixture(t: TestContext) {
  const directory = await mkdtemp(join(tmpdir(), "todo-file-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, path: join(directory, "todo.md"), files: new TodoFiles() };
}

test("creates todo.md on first add and persists edits, toggles, and deletion", async (t) => {
  const { path, files } = await fixture(t);
  let view = await files.read(path);
  assert.equal(view.exists, false);
  let result = await files.change(path, view.revision, { kind: "add", title: "Buy milk", dueDate: "2026-11-20" });
  assert.equal(result.ok, true);
  assert.equal(await readFile(path, "utf8"), "- [ ] Buy milk 📅 2026-11-20\n");
  result = await files.change(path, result.snapshot.revision, { kind: "edit", id: 1, title: "Buy oat milk", dueDate: null });
  result = await files.change(path, result.snapshot.revision, { kind: "setDone", id: 1, done: true });
  assert.equal(await readFile(path, "utf8"), "- [x] Buy oat milk\n");
  result = await files.change(path, result.snapshot.revision, { kind: "delete", id: 1 });
  assert.equal(result.ok, true);
  assert.equal(await readFile(path, "utf8"), "");
  assert.equal((await files.read(path)).exists, true);
});

test("rejects stale saves after an external edit without overwriting it", async (t) => {
  const { path, files, directory } = await fixture(t);
  await writeFile(path, "- [ ] Original\n");
  const previous = await files.read(path);
  await writeFile(path, "- [ ] Written by an agent\n");
  const result = await files.change(path, previous.revision, { kind: "setDone", id: 1, done: true });
  assert.equal(result.ok, false);
  assert.equal(result.snapshot.tasks[0].title, "Written by an agent");
  assert.equal(await readFile(path, "utf8"), "- [ ] Written by an agent\n");
  assert.deepEqual(await readdir(directory), ["todo.md"]);
});

test("serializes simultaneous writes so one cannot silently overwrite the other", async (t) => {
  const { path, files } = await fixture(t);
  const previous = await files.read(path);
  const results = await Promise.all([
    files.change(path, previous.revision, { kind: "add", title: "First", dueDate: null }),
    files.change(path, previous.revision, { kind: "add", title: "Second", dueDate: null }),
  ]);
  assert.deepEqual(results.map((result) => result.ok), [true, false]);
  assert.equal(await readFile(path, "utf8"), "- [ ] First\n");
});

test("migrates prototype tasks only into a missing file", async (t) => {
  const { path, files } = await fixture(t);
  const seed = [{ id: 9, title: "Keep my task", done: true, dueDate: "2026-11-20" }];
  assert.equal((await files.read(path, seed)).tasks[0].title, "Keep my task");
  assert.equal(await readFile(path, "utf8"), "- [x] Keep my task 📅 2026-11-20\n");
  await writeFile(path, "");
  assert.deepEqual((await files.read(path, seed)).tasks, []);
  assert.equal(await readFile(path, "utf8"), "");
});

test("does not share tasks between workspace files and detects deletion", async (t) => {
  const { path, directory, files } = await fixture(t);
  const other = join(directory, "other-todo.md");
  await writeFile(path, "- [ ] One\n");
  await writeFile(other, "- [ ] Two\n");
  const previous = await files.read(path);
  assert.equal((await files.read(other)).tasks[0].title, "Two");
  await rm(path);
  const result = await files.change(path, previous.revision, { kind: "edit", id: 1, title: "No overwrite", dueDate: null });
  assert.equal(result.ok, false);
  assert.equal(result.snapshot.exists, false);
});
