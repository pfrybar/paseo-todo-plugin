import type { TodoChange } from "../shared/files";
import { dueDateSchema, type Task } from "../shared/todos";

// Keep the original line endings and all Markdown outside the changed task.
function linesOf(text: string): { text: string; ending: string }[] {
  return Array.from(text.matchAll(/([^\r\n]*)(\r\n|\n|\r|$)/g))
    .filter((match) => match[0] !== "")
    .map((match) => ({ text: match[1], ending: match[2] }));
}

const checkbox = /^(\s*(?:[-+*]|\d+[.)])\s+\[)([ xX])(\]\s+)(.*)$/;

export function parseMarkdown(text: string): Task[] {
  const tasks: Task[] = [];
  let fence: string | null = null;
  for (const [index, line] of linesOf(text).entries()) {
    const marker = line.text.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (fence === null) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    const match = line.text.match(checkbox);
    if (!match) continue;
    const suffix = match[4].match(/\s+📅\uFE0F?\s+(\d{4}-\d{2}-\d{2})\s*$/u);
    const hasDate = suffix !== null && dueDateSchema.safeParse(suffix[1]).success;
    tasks.push({
      id: index + 1,
      title: (hasDate ? match[4].slice(0, suffix.index) : match[4]).trimEnd(),
      done: match[2].toLowerCase() === "x",
      dueDate: hasDate ? suffix[1] : null,
    });
  }
  return tasks;
}

function body(title: string, dueDate: string | null): string {
  return title.trim() + (dueDate ? ` 📅 ${dueDate}` : "");
}

export function taskLine(task: Pick<Task, "title" | "dueDate" | "done">): string {
  return `- [${task.done ? "x" : " "}] ${body(task.title, task.dueDate)}`;
}

export function applyMarkdownChange(text: string, change: TodoChange): string {
  if (change.kind === "add") {
    const ending = text.match(/\r\n|\n|\r/)?.[0] ?? "\n";
    const separator = text.length > 0 && !/[\r\n]$/.test(text) ? ending : "";
    return text + separator + taskLine({ ...change, done: false }) + ending;
  }
  if (!parseMarkdown(text).some((task) => task.id === change.id)) throw new Error("This task no longer exists. Refresh the list.");
  const lines = linesOf(text);
  const line = lines[change.id - 1];
  const match = line.text.match(checkbox)!;
  if (change.kind === "delete") lines.splice(change.id - 1, 1);
  else if (change.kind === "setDone") line.text = match[1] + (change.done ? "x" : " ") + match[3] + match[4];
  else line.text = match[1] + match[2] + match[3] + body(change.title, change.dueDate);
  return lines.map((entry) => entry.text + entry.ending).join("");
}
